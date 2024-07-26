import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import axios from "axios";
import { Nullable } from "../../Nullable";
import { ReleaseCandidate } from "../domain/entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../domain/entity/TorrentReleaseCandidate";
import { Resolution } from "../domain/value-object/Resolution";
import { RipType } from "../domain/value-object/RipType";
import { TorrentTracker } from "../domain/value-object/TorrentTracker";
import bencode from 'bencode';
import { createHash } from 'crypto';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { S3 } from '@aws-sdk/client-s3';
import { AudioLang } from "../domain/value-object/AudioLang";
import { TvShowRepository } from "../../adapters/TvShowRepository";
import { SonarrClient } from "../../adapters/SonarrClient";
import { SonarrRelease } from "../ports/ISonarr";
import { strIsBlank } from "../../utils";
import { SetTopicAttributesCommand } from "@aws-sdk/client-sns";

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const sonarrApiBaseUrl = process.env.SONARR_API_BASE_URL!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);
const secretsManager = new SecretsManager({});

const s3 = new S3({});

const torrentFilesS3Bucket = process.env.TORRENT_FILES_S3_BUCKET!;

const MONTH_IN_MILLIS = 30 * 24 * 60 * 60 * 1000;

const BR_MINIUM_BITRATE = 1500000; // byte/seconds

const MAX_RUNTIME = 13 * 60 * 1000;

export const handler = async (event: { tvShowId: string, seasonNumber: number }) => {
  const startTime = Date.now();
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const sonarrApiKey = secret.SONARR_API_KEY!;
  const sonarrClient = new SonarrClient(sonarrApiBaseUrl, sonarrApiKey);
  const tvShow = await tvShowRepo.getSeason(event.tvShowId, event.seasonNumber);
  const sonarrReleases = await sonarrClient.getAll(tvShow.tmdbId!, tvShow.getSeasonOrThrow(event.seasonNumber).tmdbSeasonNumber!);
  let allReleasesProcessed = true;
  for (let sr of sonarrReleases) {
    // Exit before lambda times out
    if (Date.now() - startTime > MAX_RUNTIME) {
      allReleasesProcessed = false;
      break;
    }
    if (tvShow.sonarrReleaseAlreadyAdded(event.seasonNumber, sr.guid)) continue;
    allReleasesProcessed = false;
    tvShow.addSonarrReleaseGuid(event.seasonNumber, sr.guid);
    if (!isTorrentRelease(sr.protocol)) {
      console.info(`Ignoring non-torrent RC=${JSON.stringify(sr)}`);
      continue;
    }
    if (sr.customFormatScore == null || sr.customFormatScore < 0) {
      console.info(`Ignoring RC with negative customFormatScore, RC=${JSON.stringify(sr)}`);
      continue;
    }
    const tracker = resolveTorrentTracker(sr);
    if (tracker == null) {
      console.warn(`Unknown torrent tracker for RC=${JSON.stringify(sr)}`);
      continue;
    }
    const seeders = sr.seeders;
    if (seeders != null && seeders <= 0) {
      console.info(`Ignoring RC because of low number of seeders, RC=${JSON.stringify(sr)}`);
      continue;
    }
    const ripType = sr.ripType;
    const resolution = sr.resolution;
    const releaseTimeInMillis = resolveReleaseTimeInMillis(sr.age, sr.ageInMinutes, tracker);
    const downloadUrl = sr.downloadUrl;
    const sonarrLanguages  = sr.languages;
    const lastEpisodeReleaseTime = tvShow.estimatedLastEpisodeReleaseTime(event.seasonNumber);
    if ((lastEpisodeReleaseTime != null && (Date.now() - lastEpisodeReleaseTime > 3 * MONTH_IN_MILLIS)) &&
       !tracker.isLanguageSpecific() && (sonarrLanguages.length === 0 ||
         (sonarrLanguages.length === 1 && (AudioLang.fromRadarrLanguage(sonarrLanguages[0]) != null &&
           AudioLang.fromRadarrLanguage(sonarrLanguages[0])?.lang === tvShow.originalLocale.lang || sonarrLanguages[0] === "unknown")))) {
      continue;
    }
    if (downloadUrl.startsWith("magnet")) {
      if (strIsBlank(sr.infoHash)) {
        console.warn(`infoHash must be available in case of magnet links, RC=${sr}`);
        continue;
      }
      const episodeNumber = resolveEpisodeNumber(sr);
      const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, downloadUrl,
        null, resolution, ripType, tracker, sr.infoHash!, sr.infoUrl, seeders, sonarrLanguages, false);
      if (episodeNumber != null) {
        tvShow.addRCToEpisode(event.seasonNumber, episodeNumber, sr.infoHash!, rc);
      } else {
        tvShow.addRCToSeason(event.seasonNumber, sr.infoHash!, rc);
      }
    } else {
      const response = await axios.get(downloadUrl, { responseType: 'arraybuffer', maxRedirects: 0 });
      let locationHeader: Nullable<string> = response.headers?.Location;
      if (locationHeader == null) locationHeader = response.headers?.location;
      if (locationHeader != null && locationHeader.startsWith("magnet")) {
        let hash = sr.infoHash;
        if (strIsBlank(hash)) {
          const hashPrefix = "xt=urn:btih:";
          let hashStartIndex = locationHeader.indexOf(hashPrefix) + hashPrefix.length;
          let hashEndIndex = locationHeader.indexOf('&', hashStartIndex);
          hash = locationHeader.substring(hashStartIndex, hashEndIndex);
        }
        if (strIsBlank(hash)) {
          console.warn(`Could not resolve hash for RC=${sr}`);
          continue;
        }
        const episodeNumber = resolveEpisodeNumber(sr);
        const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, locationHeader,
          null, resolution, ripType, tracker, hash!, sr.infoUrl, seeders, sonarrLanguages, false);
        if (episodeNumber != null) {
          tvShow.addRCToEpisode(event.seasonNumber, episodeNumber, hash!, rc);
        } else {
          tvShow.addRCToSeason(event.seasonNumber, hash!, rc);
        }
      } else {
        const torrentFile = response.data;
        const decodedTorrent = bencode.decode(torrentFile);
        const info = decodedTorrent['info'];
        const bencodedInfo = bencode.encode(info);
        let hash = createHash('sha1').update(bencodedInfo).digest('hex');
        const episodeNumber = resolveEpisodeNumber(sr);
        let s3ObjectKey;
        if (episodeNumber != null) {
          s3ObjectKey = `${tvShow.id}/${event.seasonNumber}/${episodeNumber}/${hash}`;
        } else {
          s3ObjectKey = `${tvShow.id}/${event.seasonNumber}/${hash}`;
        }
        const s3Params = {
          Bucket: torrentFilesS3Bucket,
          Key: s3ObjectKey,
          Body: torrentFile
        };
        await s3.putObject(s3Params);
        const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, s3ObjectKey,
          null, resolution, ripType, tracker, hash, sr.infoUrl, seeders, sonarrLanguages, false);
        if (episodeNumber != null) {
          tvShow.addRCToEpisode(event.seasonNumber, episodeNumber, hash!, rc);
        } else {
          tvShow.addRCToSeason(event.seasonNumber, hash!, rc);
        }
      }
    }  
  }
  if (allReleasesProcessed) {
    tvShow.setSeasonReadyToBeProcessed(event.seasonNumber, true);
  }
  await tvShowRepo.save(tvShow, false, [event.seasonNumber], { [event.seasonNumber]: tvShow.getSeasonOrThrow(event.seasonNumber).episodes.map(e => e.episodeNumber) });
};

function resolveTorrentTracker(sr: SonarrRelease) {
  const infoUrl = sr.infoUrl == null ? "" : sr.infoUrl;
  const commentUrl = sr.commentUrl == null ? "" : sr.commentUrl;
  const url = infoUrl + commentUrl;
  let tracker = TorrentTracker.fromRadarrInfoCommentUrl(url);
  if (tracker == null) tracker = TorrentTracker.fromRadarrReleaseIndexerName(sr.indexer);
  return tracker;
}

function resolveReleaseTimeInMillis(radarrAge: Nullable<number>, radarrAgeMinutes: Nullable<number>, tracker: TorrentTracker) {
  if (radarrAge == null || radarrAgeMinutes == null) return null;
  if (radarrAge === 0 && (TorrentTracker.equals(tracker, TorrentTracker.CINECALIDAD) ||
  TorrentTracker.equals(tracker, TorrentTracker.DONTORRENT) || TorrentTracker.equals(tracker, TorrentTracker.OXTORRENT))) {
    return null;
  }
  return Math.round(Date.now() - radarrAgeMinutes * 60 * 1000);
}

function isTorrentRelease(protocol: string) {
  return protocol === "torrent";
}

function resolveEpisodeNumber(sr: SonarrRelease) {
  throw new Error('not implemented');
}
