import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { Movie } from "../domain/aggregate/Movie";
import axios from 'axios';
import { MovieRepository } from '../../adapters/MovieRepository';
import { S3 } from '@aws-sdk/client-s3';
import { strIsBlank } from '../../utils';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const torrentFilesS3Bucket = process.env.TORRENT_FILES_S3_BUCKET!;
const rawMediaFilesS3Bucket = process.env.RAW_MEDIA_FILES_S3_BUCKET!;

const secretsManager = new SecretsManager({});

const marshaller = new Marshaller();
const radarrBaseUrl = process.env.RADARR_BASE_URL!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo = new MovieRepository(docClient);
const s3 = new S3({});

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

const radarrClient = axios.create({
  baseURL: radarrBaseUrl,
});

interface MovieRead {
  _id: string;
  _tmdbId: string;
  _originalTitle: string;
  _releaseYear: number;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const radarrApiKey = secret.RADARR_API_KEY!;
    const tmdbApiKey = secret.TMDB_API_KEY!;
    tmdbClient.interceptors.request.use((config) => {
      config.params = config.params || {};
      config.params['api_key'] = tmdbApiKey;
      return config;
    });
    radarrClient.defaults.headers.common['x-api-key'] = radarrApiKey;

    for (const record of event.Records) {
      if (record.eventName === 'REMOVE') {
        let movieId = record.dynamodb?.Keys?._id.S;
        await emptyS3Directory(rawMediaFilesS3Bucket, movieId);
        await emptyS3Directory(torrentFilesS3Bucket, movieId);
      } else {
        let movieRead: MovieRead = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as MovieRead;
        if (movieRead._tmdbId == null) return;
        let movie = await movieRepo.getMovieById(movieRead._id);
        if (await updateMovie(movie, movieRead._tmdbId)) {
          await movieRepo.saveMovie(movie);
          return;
        }
        const getMovieFromRadarrResponse: any[] = (await radarrClient.get(`movie/?tmdbId=${movieRead._tmdbId}`)).data;
        // check if the movie already exists in radarr
        if (getMovieFromRadarrResponse.length > 0) {
          return;
        }
        const radarrLookupResponse = (await radarrClient.get(`movie/lookup/tmdb?tmdbid=${movieRead._tmdbId}`)).data;
        radarrLookupResponse.addOptions = { monitor: "none", searchForMovie: false };
        radarrLookupResponse.folder = `${movieRead._originalTitle} (${movieRead._releaseYear})`;
        const rootFolder: string = (await radarrClient.get(`rootfolder/1`)).data.path;
        radarrLookupResponse.rootFolderPath = rootFolder;
        radarrLookupResponse.qualityProfileId = 1; // 1 is the id of quality profile 'Any'
        (await radarrClient.post('movie', radarrLookupResponse));
      }
    }
  } catch (e) {
    console.error(e);
  } 
};

async function updateMovie(movie: Movie, tmdbId: string) {
  const getMovieDataEnUs = (await tmdbClient.get(`movie/${tmdbId}?language=en-US`)).data;
  const getMovieDataRu = (await tmdbClient.get(`movie/${tmdbId}?language=ru`)).data;
  const alternativeTitlesData = (await tmdbClient.get(`movie/${tmdbId}/alternative_titles`)).data;
  const releaseDate = getMovieDataEnUs.release_date;
  let runtime = getMovieDataEnUs.runtime;
  let alternativeTitles: string[] = [];
  const titleEnUs = getMovieDataEnUs.title;
  if (titleEnUs != null) {
    alternativeTitles.push(titleEnUs);
  }
  const titleRu = getMovieDataRu.title;
  if (titleRu != null) {
    alternativeTitles.push(titleRu);
  }
  for (let t of alternativeTitlesData.titles) {
    if (t.type === "romanized title") {
      alternativeTitles.push(t.title);
    }
  }
  let updated = false;
  if (releaseDate != null && releaseDate.trim() !== "") {
    const millis = new Date(releaseDate).getTime();
    if (movie.releaseTimeInMillis !== millis) {
      movie.releaseTimeInMillis = millis;
      updated = true;
    }
  }
  if (runtime != null) {
    runtime = 60 * runtime;
    if (movie.runtimeSeconds != runtime) {
      movie.runtimeSeconds = runtime;
      updated = true;
    }
  }
  if (movie.alternativeTitles.length === 0) {
    movie.alternativeTitles = alternativeTitles;
    updated = true;
  }
  return updated;
}

async function emptyS3Directory(bucket, dir) {
  if (strIsBlank(dir)) return;
  if (!dir.endswith('/')) dir = `${dir}/`

  const listParams = {
    Bucket: bucket,
    Prefix: dir
  };
  
  const listedObjects = await s3.listObjectsV2(listParams);
  
  if (listedObjects.Contents == undefined ||
    listedObjects.Contents.length === 0) return;
  
  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  };
  
  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key } as never);
  });
  
  if (deleteParams.Delete.Objects.length !== 0) {
    await s3.deleteObjects(deleteParams);
  }
  
  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}
