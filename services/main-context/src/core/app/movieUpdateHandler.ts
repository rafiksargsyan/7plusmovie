import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { v2 as cloudinary } from 'cloudinary';
import { S3 } from '@aws-sdk/client-s3';
import { MovieGenre, MovieGenres } from '../domain/MovieGenres';
import { Person, Persons } from '../domain/Persons';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { Movie } from "../domain/Movie";
import axios from 'axios';
import { L8nLangCode } from '../domain/L8nLangCodes';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});
const s3 = new S3({});

const marshaller = new Marshaller();

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

const tmdbImageClient = axios.create({
  baseURL: 'https://image.tmdb.org/t/p/original/',
  responseType: 'arraybuffer'
});

const mediaAssetsS3Bucket = process.env.MEDIA_ASSETS_S3_BUCKET!;

interface MovieRead {
  id: string;
  originalTitle: string;
  posterImagesPortrait: { [key: string]: string };
  subtitles: { [key: string]: string };
  releaseYear: number;
  titleL8ns: { [key: string]: string };
  creationTime: number;
  mpdFile: string;
  m3u8File: string;
  genres: MovieGenre[];
  actors: Person[];
  directors: Person[];
  tmdbId: string | undefined;
  backdropImage: string;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, secret.ALGOLIA_ADMIN_KEY!);
  const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);
  const tmdbApiKey = secret.TMDB_API_KEY!;
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                      api_key: process.env.CLOUDINARY_API_KEY,
                      api_secret: secret.CLOUDINARY_API_SECRET });

  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      let objectID = record.dynamodb?.Keys?.id.S;
      await algoliaIndex.deleteBy({filters: `objectID: ${objectID}`});
      await cloudinary.api.delete_resources_by_prefix(objectID!);
      await emptyS3Directory(mediaAssetsS3Bucket, `${objectID}/`);
    } else {
      let movie: MovieRead = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as MovieRead;
      let updated: boolean = false;
      if (movie.tmdbId != undefined) {
        updated = await updateBasedOnTmdbId(movie.id, movie.tmdbId, tmdbApiKey, movie);
      } 
      if (updated) {
        return;
      }
      if (movie.mpdFile == null || movie.m3u8File == null
        || Object.keys(movie.posterImagesPortrait).length === 0) {
        return;
      }
      await algoliaIndex.saveObject({ objectID: movie.id,
                                      creationTime: movie.creationTime,
                                      category: "MOVIE",
                                      originalTitle: movie.originalTitle,
                                      posterImagesPortrait: movie.posterImagesPortrait,
                                      titleL8ns: movie.titleL8ns,
                                      releaseYear: movie.releaseYear,
                                      genres: movie.genres.reduce((r, _) => { return { ...r, [_.code] : MovieGenres[_.code] } }, {}),
                                      actors: movie.actors.reduce((r, _) => { return { ...r, [_.code] : Persons[_.code] } }, {}),
                                      directors: movie.directors.reduce((r, _) => { return { ...r, [_.code] : Persons[_.code] } }, {}) });
    }
  }
};

async function emptyS3Directory(bucket, dir) {
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

  await s3.deleteObjects(deleteParams);

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}

async function updateBasedOnTmdbId(movieId: string, tmdbId: string, tmdbApiKey: string, movieRead: MovieRead) {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': movieId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, data.Item);
  let updated: boolean = false;

  const tmdbMovieEnUs = (await tmdbClient.get(`movie/${tmdbId}?api_key=${tmdbApiKey}&language=en-US`)).data;
  const tmdbMovieRu = (await tmdbClient.get(`movie/${tmdbId}?api_key=${tmdbApiKey}&language=ru`)).data;

  const titleEnUs: string = tmdbMovieEnUs.title;
  const titleRu: string = tmdbMovieRu.title;
  const posterPathEnUs: string = tmdbMovieEnUs.poster_path;
  const posterPathRu: string = tmdbMovieRu.poster_path;
  const backdropPath: string = tmdbMovieEnUs.backdrop_path;

  if (movieRead.titleL8ns['EN_US'] == undefined && titleEnUs != undefined) {
    movie.addTitleL8n(new L8nLangCode('EN_US'), titleEnUs);
    updated = true;
  }
  if (movieRead.titleL8ns['RU'] == undefined && titleRu != undefined) {
    movie.addTitleL8n(new L8nLangCode('RU'), titleRu);
    updated = true;
  } 
  if (movieRead.posterImagesPortrait['EN_US'] == undefined && posterPathEnUs != undefined) {
    const posterImagePortraitEnUs = (await tmdbImageClient.get(posterPathEnUs)).data;
    if (posterImagePortraitEnUs != undefined) {
      const objectKey = `${movieId}/posterImagePortrait-EN_US.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: posterImagePortraitEnUs,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      movie.addPosterImagePortrait(new L8nLangCode('EN_US'), objectKey);
      updated = true;
    }
  }
  if (movieRead.posterImagesPortrait['RU'] == undefined && posterPathRu != undefined) {
    const posterImagePortraitRu = (await tmdbImageClient.get(posterPathRu)).data;
    if (posterImagePortraitRu != undefined) {
      const objectKey = `${movieId}/posterImagePortrait-RU.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: posterImagePortraitRu,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      movie.addPosterImagePortrait(new L8nLangCode('RU'), objectKey);
      updated = true;
    }
  }
  if (movieRead.backdropImage == undefined && backdropPath != undefined) {
    const backdropImage = (await tmdbImageClient.get(backdropPath)).data;
    if (backdropImage != undefined) {
      const objectKey = `${movieId}/backdropImage.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: backdropImage,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      movie.addBackdropImage(objectKey);
      updated = true;
    }
  }
  if (updated) {
    await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
  }
  return updated;
}

class FailedToGetMovieError extends Error {}
