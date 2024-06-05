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

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const movieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const prowlarrBaseUrl = process.env.PROWLARR_BASE_URL!;
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
    const protocol = rr.protocol;
    if (protocol == null || protocol != "torrent") continue;
    const customFormatScore = rr.customFormatScore;
    if (customFormatScore != null && customFormatScore < 0) continue;
    let tracker = TorrentTracker.fromRadarrReleaseGuid(rr.guid);
    if (tracker == null) tracker = TorrentTracker.fromRadarrReleaseIndexerName(rr.indexer);
    if (tracker == null) continue;
    const ripType = RipType.fromRadarrReleaseQualitySource(rr?.quality?.quality?.source);
    if (ripType == null) continue;
    const radarrResolution = rr?.quality?.quality?.resolution;
    const resolution = Resolution.fromPixels(radarrResolution, radarrResolution);
    if (resolution == null) continue;
    let releaseTimeInMillis: Nullable<number> = null;
    const radarrAgeMinutes = rr.ageMinutes;
    if (radarrAgeMinutes != null) {
      releaseTimeInMillis = Date.now() - radarrAgeMinutes * 60 * 1000;
    }
    const sizeInBytes = rr.size;
    const radarrDownloadUrl: string = rr.downloadUrl;
    if (radarrDownloadUrl == null) continue;
    const pathStart = radarrDownloadUrl.indexOf("/", 8) + 1;
    const publicDownloadUrl = `${prowlarrBaseUrl}${radarrDownloadUrl.substring(pathStart)}`;
    const response = await axios.get(publicDownloadUrl, { responseType: 'arraybuffer', maxRedirects: 0 });
    let locationHeader: Nullable<string> = response.headers?.Location;
    if (locationHeader == null) locationHeader = response.headers?.location;
    if (locationHeader != null && locationHeader.startsWith("magnet")) {
      const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, locationHeader,
        sizeInBytes, resolution, ripType, tracker, rr.infoHash);
      m.addReleaseCandidate(rr.infoHash, rc);
    } else {
      const torrentFile = response.data;
      const decodedTorrent = bencode.decode(torrentFile);
      const info = decodedTorrent['info'];
      const bencodedInfo = bencode.encode(info);
      const infoHash = createHash('sha1').update(bencodedInfo).digest('hex');
      const rc: ReleaseCandidate = new TorrentReleaseCandidate(false, releaseTimeInMillis, publicDownloadUrl,
        sizeInBytes, resolution, ripType, tracker, infoHash);
      m.addReleaseCandidate(infoHash, rc);
    }
  }
  await docClient.put({ TableName: movieTableName, Item: m }); 
};
