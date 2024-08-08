import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import axios from "axios";
import { Nullable } from "../../Nullable";
import { ReleaseCandidate } from "../domain/entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../domain/entity/TorrentReleaseCandidate";
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
import { TvShow } from "../domain/aggregate/TvShow";

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
    try {
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
      if (seeders != null && seeders <= 5) {
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
        const episodeNumbers = resolveEpisodeNumbers(sr, event.seasonNumber, tvShow);
        const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, downloadUrl,
          null, resolution, ripType, tracker, sr.infoHash!, sr.infoUrl, seeders, sonarrLanguages, false);
        if (episodeNumbers == null) {
          tvShow.addRCToSeason(event.seasonNumber, sr.infoHash!, rc);
        } else if (episodeNumbers.length !== 0) {
          tvShow.addRCToEpisodes(event.seasonNumber, episodeNumbers, sr.infoHash!, rc);
        } else {
          continue;
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
          const episodeNumbers = resolveEpisodeNumbers(sr, event.seasonNumber, tvShow);
          const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, locationHeader,
            null, resolution, ripType, tracker, hash!, sr.infoUrl, seeders, sonarrLanguages, false);
          if (episodeNumbers == null) {
            tvShow.addRCToSeason(event.seasonNumber, hash!, rc);
          } else if (episodeNumbers.length !== 0) {
            tvShow.addRCToEpisodes(event.seasonNumber, episodeNumbers, hash!, rc);
          } else {
            continue;
          }
        } else {
          const torrentFile = response.data;
          const decodedTorrent = bencode.decode(torrentFile);
          const info = decodedTorrent['info'];
          const bencodedInfo = bencode.encode(info);
          let hash = createHash('sha1').update(bencodedInfo).digest('hex');
          const s3ObjectKey = `${tvShow.id}/${event.seasonNumber}/${hash}`;
          const s3Params = {
            Bucket: torrentFilesS3Bucket,
            Key: s3ObjectKey,
            Body: torrentFile
          };
          await s3.putObject(s3Params);
          const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, s3ObjectKey,
            null, resolution, ripType, tracker, hash, sr.infoUrl, seeders, sonarrLanguages, false);
          const episodeNumbers = resolveEpisodeNumbers(sr, event.seasonNumber, tvShow);
          if (episodeNumbers == null) {
            tvShow.addRCToSeason(event.seasonNumber, hash!, rc);
          } else if (episodeNumbers.length !== 0) {
            tvShow.addRCToEpisodes(event.seasonNumber, episodeNumbers, hash!, rc);
          } else {
            continue;
          }
        }
      }
    } catch (e) {
      const msg = `Error while processing RC=${JSON.stringify(sr)}, ${(e as Error).message}`
      console.error(msg)
    }   
  }
  if (allReleasesProcessed) {
    console.info(`All RCs have been processed for tvShowId=${tvShow.id},season=${event.seasonNumber}`);
    tvShow.setSeasonReadyToBeProcessed(event.seasonNumber, true)
  }
  await tvShowRepo.save(tvShow, false, [event.seasonNumber], { [event.seasonNumber]: tvShow.getSeasonOrThrow(event.seasonNumber).episodes.map(e => e.episodeNumber) })
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

/**
 * TODO: safeguard episode numbers
 * @returns {number[]} null means the release must be added to all episodes, empty means no episode was found
 */
function resolveEpisodeNumbers(sr: SonarrRelease, seasonNumber: number, tvShow: TvShow): Nullable<number[]> {
  let maxEpisodeNumber = 1;
  for (const e of tvShow.getSeasonOrThrow(seasonNumber).episodes) {
    maxEpisodeNumber = Math.max(maxEpisodeNumber, e.episodeNumber)
  }
  // Getting rid of noisy numbers
  const titleLC = sr.title.toLowerCase().replace(/(480p)|(720p)|(1080p)|(2160p)/g, '');
  let titlePrefixMatched = false;
  tvShow.names.forEach(n => {
    n = n.replace(/^a-zA-Z0-9/g, '');
    const dotted = n.replace(/\s+/g, '.');
    if (titleLC.startsWith(n) || titleLC.startsWith(dotted)) {
      titlePrefixMatched = true;
    }
  })
  if (!titlePrefixMatched) {
    console.warn(`Release title prefixed did not match for RC=${JSON.stringify(sr)}, seasonNumber=${seasonNumber}`);
    return [];
  }
  const regex1 = new RegExp(String.raw`s0*${seasonNumber}`);
  const regex2 = new RegExp(String.raw`temporada\s*${seasonNumber}`);
  const regex3 = new RegExp(String.raw`saison\s*0*${seasonNumber}`);
  // For example 'Breaking.Bad.Complete.Series (S01-S05) .720p.BluRay.Goblin.Eng.A' or
  // 'Breaking Bad S01 S05 Complete 720p BluRay x265 BMF'
  const regex4 = new RegExp(String.raw`s(0*[1-9]+)[-\s][-\s+](0*[1-9]+)`);
  // For example 'Breaking.Bad.S01-S02-S03-S04-S05.1080p.BluRay.10bit.HEVC-MkvCage'
  const regex5 = new RegExp(String.raw`s(0*[1-9]+).*s(0*[1-9]+).*s(0*[1-9]+)`);
  const regex4Matchs = titleLC.match(regex4);
  if (regex4Matchs != null && titleLC.match(regex5) == null) {
    const seriesStart = Number.parseInt(regex4Matchs[1])
    const seriesEnd = Number.parseInt(regex4Matchs[2])
    if (seasonNumber < seriesStart || seasonNumber > seriesEnd) {
      console.warn(`Season not found in season range for RC=${JSON.stringify(sr)}, seasonNumber=${seasonNumber}`)
      return []
    }
  } else if (titleLC.match(regex1) == null && titleLC.match(regex2) == null && titleLC.match(regex3) == null) {
    console.warn(`Season not found for RC=${JSON.stringify(sr)}, seasonNumber=${seasonNumber}`)
    return []
  }
  // For example 'Breaking Bad / S5E1-16 of 16 [2012, BDRemux 1080p] MVO (LostFilm) + DVO + MVO (AMEDIA) + Original' or
  // 'Breaking Bad S05e01 16 [1080p Ita Eng Spa h265 10bit SubS][MirCrewRelease] byMe7alh'
  const episodeRegex1 = new RegExp(String.raw`s0*${seasonNumber}\s*e(0*[1-9]+)[-\s]+(0*[1-9]+)`);
  const episodeRegex1Matchs = titleLC.match(episodeRegex1);
  if (episodeRegex1Matchs != null) {
    const startEpisode = Number.parseInt(episodeRegex1Matchs[1]);
    const endEpisode = Math.min(Number.parseInt(episodeRegex1Matchs[2]), maxEpisodeNumber);
    if (startEpisode <= endEpisode) {
      const ret: number[] = [];
      for (let i = startEpisode; i <= endEpisode; ++i) {
        ret.push(i);
      }
      return ret;
    }
  }
  // For example 'Breaking Bad S04e08 Versione 720p BDMux 720p H264 Ita Eng AC3 5.1 Sub Ita Eng TntVillage-Darksidemux'
  const episodeRegex2 = new RegExp(String.raw`s0*${seasonNumber}\s*e(0*[1-9]+)`);
  const episodeRegex2Matchs = titleLC.match(episodeRegex2);
  if (episodeRegex2Matchs != null) {
    const episode = Number.parseInt(episodeRegex2Matchs[1]);
    return [episode];
  }
  // todo: 'Los Simpsons Temporada 2 [HDTV 720p][Cap 201 211][AC3 5 1 Castellano]'
  return null;
}
