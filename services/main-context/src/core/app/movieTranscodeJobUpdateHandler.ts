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

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
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
      if (movie.genres == undefined) movie.genres = [];
      if (movie.actors == undefined) movie.actors = [];
      if (movie.directors == undefined) movie.directors = [];
    }
  }
};