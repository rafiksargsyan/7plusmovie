import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from "../ports/MovieRepositoryInterface";
import { MovieRepository } from "../../adapters/MovieRepository";
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
import { ObjectCannedACL, S3 } from '@aws-sdk/client-s3';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const movieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const radarrApiBaseUrl = process.env.RADARR_API_BASE_URL!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);
const secretsManager = new SecretsManager({});

const radarrClient = axios.create({
  baseURL: radarrApiBaseUrl,
});

// don't redirect magnet urls
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && [301, 302].includes(error.response.status)) {
      return error.response;
    }
    return Promise.reject(error);
  }
);

const s3 = new S3({});

const torrentFilesS3Bucket = process.env.TORRENT_FILES_S3_BUCKET!;

const radarrDownloadUrlBaseMapping = JSON.parse(process.env.RADARR_DOWNLOAD_URL_BASE_MAPPING!);

export const handler = async (event: { movieId: string }) => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const radarrApiKey = secret.RADARR_API_KEY!;
  radarrClient.defaults.headers.common['x-api-key'] = radarrApiKey;
  const m: Movie = await movieRepo.getMovieById(event.movieId);
  m.checkAndEmptyReleaseCandidates(true);
  const radarrMovieId = (await radarrClient.get(`movie/?tmdbId=${m.tmdbId}`)).data[0].id;
  const getReleasesResult = (await radarrClient.get(`release/?movieId=${radarrMovieId}`)).data;
  for (let rr of getReleasesResult) {
    try {
      checkProtocol(rr.protocol);
      checkCustomFormatScore(rr.customFormatScore);
      const tracker = resolveTorrentTrackerOrThrow(rr, rr.indexer);
      if (TorrentTracker.equals(tracker, TorrentTracker.DONTORRENT)) {
        await checkReleaseYearFromInfoUrl(rr.infoUrl, m.releaseYear);
      }
      const seeders = checkSeeders(rr.seeders);
      const ripType = RipType.fromRadarrReleaseQualitySourceOrThrow(rr?.quality?.quality?.source);
      const resolution = Resolution.fromPixelsOrThrow(rr?.quality?.quality?.resolution, rr?.quality?.quality?.resolution);
      const releaseTimeInMillis = resolveReleaseTimeInMillis(rr.age, rr.ageMinutes, tracker);
      const sizeInBytes = rr.size;
      const radarrDownloadUrl = checkRadarrDownloadUrl(rr.downloadUrl);
      if (radarrDownloadUrl.startsWith("magnet")) {
        const hash = checkEmptyHash(rr.infoHash);
        checkDuplicateHash(hash, m);
        const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, radarrDownloadUrl,
          sizeInBytes, resolution, ripType, tracker, hash, rr.infoUrl, seeders);
        m.addReleaseCandidate(hash, rc);
      } else {
        const publicDownloadUrl = checkUrlLength(getTorrentPublicDownloadURLOrThrow(radarrDownloadUrl));
        const response = await axios.get(publicDownloadUrl, { responseType: 'arraybuffer', maxRedirects: 0 });
        let locationHeader: Nullable<string> = response.headers?.Location;
        if (locationHeader == null) locationHeader = response.headers?.location;
        if (locationHeader != null && locationHeader.startsWith("magnet")) {
          const hash = checkEmptyHash(rr.infoHash);
          checkDuplicateHash(hash, m);
          const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, locationHeader,
            sizeInBytes, resolution, ripType, tracker, hash, rr.infoUrl, seeders);
          m.addReleaseCandidate(hash, rc);
        } else {
          const torrentFile = response.data;
          const decodedTorrent = bencode.decode(torrentFile);
          const info = decodedTorrent['info'];
          const bencodedInfo = bencode.encode(info);
          let hash = checkEmptyHash(createHash('sha1').update(bencodedInfo).digest('hex'));
          checkDuplicateHash(hash, m);
          const s3ObjectKey = `${m.id}/${hash}`;
          const s3Params = {
            Bucket: torrentFilesS3Bucket,
            Key: s3ObjectKey,
            Body: torrentFile
          };
          await s3.putObject(s3Params);
          const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, s3ObjectKey,
            sizeInBytes, resolution, ripType, tracker, hash, rr.infoUrl, seeders);
          m.addReleaseCandidate(hash, rc);
        }
      }
    } catch(e) {
      console.log(e);
    }   
  }
  await docClient.put({ TableName: movieTableName, Item: m }); 
};

function resolveTorrentTrackerOrThrow(rr: { infoUrl: string, commentUrl: string },
                                      indexerName: Nullable<string>) {
  const url = rr.infoUrl + rr.commentUrl;
  let tracker = TorrentTracker.fromRadarrInfoCommentUrl(url);
  if (tracker == null) tracker = TorrentTracker.fromRadarrReleaseIndexerName(indexerName);
  if (tracker == null) {
    throw new Error(`Failed to resolve the torrent tracker for (raddarrInfoCommentUrl=${url}, radarrReleaseIndexerName=${indexerName})`);
  }
  return tracker;
}

function checkProtocol(protocol: Nullable<string>) {
  if (protocol == null || protocol != "torrent") {
    throw new Error(`Unsupported protocol=${protocol}`);
  } 
}

function checkCustomFormatScore(customFormatScore: Nullable<number>) {
  if (customFormatScore != null && customFormatScore < 0) {
    throw new Error(`Invalid customFormatScore=${customFormatScore}`);
  }
}

function checkSeeders(seeders: Nullable<number>) {
  if (seeders == null || seeders <= 0) {
    throw new Error(`Invalid seeders=${seeders}`);
  }
  return seeders;
}

function resolveReleaseTimeInMillis(radarrAge: Nullable<number>, radarrAgeMinutes: Nullable<number>, tracker: TorrentTracker) {
  if (radarrAge == null || radarrAgeMinutes == null) return null;
  if (radarrAge === 0 && (TorrentTracker.equals(tracker, TorrentTracker.CINECALIDAD) ||
  TorrentTracker.equals(tracker, TorrentTracker.DONTORRENT))) {
    return null;
  }
  return Math.round(Date.now() - radarrAgeMinutes * 60 * 1000);
}

function checkRadarrDownloadUrl(url: Nullable<string>) {
  if (url == null || url.trim() === "") {
    throw new Error("Empty radarr download URL");
  }
  return url;
}

function getTorrentPublicDownloadURLOrThrow(radarrDownloadUrl: string) {
  for (let k in radarrDownloadUrlBaseMapping) {
    if (radarrDownloadUrl.startsWith(k)) {
      const publicBase = radarrDownloadUrlBaseMapping[k];
      return publicBase + radarrDownloadUrl.substring(k.length);
    }
  }
  throw new Error(`Failed to resolve public download url for ${radarrDownloadUrl}`);
}

function checkEmptyHash(hash: string) {
  if (hash == null || hash.trim() == "") {
    throw new Error('Torrent hash is empty');
  }
  return hash;
}

function checkDuplicateHash(hash: string, m: Movie) {
  if (hash in m.releaseCandidates) {
    throw new Error(`A release candidate with hash=${hash} already exists`);
  }
}

async function checkReleaseYearFromInfoUrl(infoUrl: string, releaseYear: number) {
  const response = await axios.get(infoUrl);
  const regex = new RegExp(String.raw`campo:\s*'anyo',\s*valor:\s*'${releaseYear}`);
  if (!regex.test(response.data)) {
    throw new Error('Release year didn\'t match for DonTorrent release');
  }
}

function checkUrlLength(url: string) {
  if (url.length > 2000) {
    throw new Error('Url is too big');
  }
  return url;
}
