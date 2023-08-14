// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens transcoding context
// event and calls application logic. We might also consider this with other handlers.

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Movie } from "../domain/Movie";
import { SubsLangCode, SubsLangCodes } from "../domain/SubsLangCodes";

const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};
  
const translateConfig = { marshallOptions };
  
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface HandlerParam {
  transcodingContextJobId: string;
}

interface TextTranscodeSpec {
  stream: number;
  forced: boolean;
  lang: SubsLangCode;
}

interface MovieTranscodingJobRead {
  movieId?: string;
  textTranscodeSpecs?: TextTranscodeSpec[];
}

export const handler = async (event: HandlerParam): Promise<void> => {
  const scanParams = {
    TableName: dynamodbMovieTranscodingJobTableName,
    FilterExpression: '#transcodingContextJobId = :value',
    ExpressionAttributeNames: { '#transcodingContextJobId': 'transcodingContextJobId' },
    ExpressionAttributeValues: { ':value': event.transcodingContextJobId }
  } as const;
  let data = await docClient.scan(scanParams);
  if (data === undefined || data.Items === undefined || data.Items.length == 0) {
    throw new FailedToGetMovieTranscodingJobError();
  }
  let movieTranscodingJobRead: MovieTranscodingJobRead = {};
  Object.assign(movieTranscodingJobRead, data.Items[0]);
  
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id':  movieTranscodingJobRead.movieId }
  } as const;
  let movieData = await docClient.get(queryParams);
  if (movieData === undefined || movieData.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, movieData.Item);

  movie.addMpdFile(`${movie.id}/vod/manifest.mpd`);
  movie.addM3u8File(`${movie.id}/vod/master.m3u8`);
  movieTranscodingJobRead.textTranscodeSpecs?.forEach(_ => {
    movie.addSubtitle(_.lang, `${movie.id}/subtitles/${SubsLangCodes[_.lang.code]['langTag']}.vtt`);
  })
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
};

class FailedToGetMovieTranscodingJobError extends Error {};

class FailedToGetMovieError extends Error {};
