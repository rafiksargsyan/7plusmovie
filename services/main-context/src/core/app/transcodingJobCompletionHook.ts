// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens transcoding context
// event and calls application logic. We might also consider this with other handlers.

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Movie } from "../domain/Movie";
import { SubsLangCode, SubsLangCodes } from "../domain/SubsLangCodes";
import { TvShow } from "../domain/TvShow";

const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbTvShowTranscodingJobTableName = process.env.DYNAMODB_TV_SHOW_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
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

interface TvShowTranscodingJobRead {
  tvShowId?: string;
  season?: number;
  episode?: number;
  textTranscodeSpecs?: TextTranscodeSpec[];
}

export const handler = async (event: HandlerParam): Promise<void> => {
  let scanParams = {
    TableName: dynamodbMovieTranscodingJobTableName,
    FilterExpression: '#transcodingContextJobId = :value',
    ExpressionAttributeNames: { '#transcodingContextJobId': 'transcodingContextJobId' },
    ExpressionAttributeValues: { ':value': event.transcodingContextJobId }
  } as const;
  let data = await docClient.scan(scanParams);
  if (data != undefined && data.Items != undefined && data.Items.length != 0) {
    let movieTranscodingJobRead: MovieTranscodingJobRead = {};
    Object.assign(movieTranscodingJobRead, data.Items[0]);
  
    const queryParams = {
      TableName: dynamodbMovieTableName,
      Key: { 'id':  movieTranscodingJobRead.movieId }
    } as const;
    let movieData = await docClient.get(queryParams);
    if (movieData == undefined || movieData.Item == undefined) {
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
    return;
  }
  
  scanParams = {
    TableName: dynamodbTvShowTranscodingJobTableName,
    FilterExpression: '#transcodingContextJobId = :value',
    ExpressionAttributeNames: { '#transcodingContextJobId': 'transcodingContextJobId' },
    ExpressionAttributeValues: { ':value': event.transcodingContextJobId }
  } as const;
  data = await docClient.scan(scanParams);
  if (data != undefined && data.Items != undefined && data.Items.length != 0) {
    let tvShowTranscodingJobRead: TvShowTranscodingJobRead = {};
    Object.assign(tvShowTranscodingJobRead, data.Items[0]);
  
    const queryParams = {
      TableName: dynamodbTvShowTableName,
      Key: { 'id':  tvShowTranscodingJobRead.tvShowId }
    } as const;
    let tvShowData = await docClient.get(queryParams);
    if (tvShowData == undefined || tvShowData.Item == undefined) {
      throw new FailedToGetTvShowError();
    }
    let tvShow = new TvShow(true);
    Object.assign(tvShow, tvShowData.Item);

    const season = tvShowTranscodingJobRead.season;
    const episode = tvShowTranscodingJobRead.episode;
    tvShow.addMpdFile(season, episode, `${tvShow.id}/${season}/${episode}/vod/manifest.mpd`);
    tvShow.addM3u8File(season, episode, `${tvShow.id}/${season}/${episode}/vod/master.m3u8`);
    tvShowTranscodingJobRead.textTranscodeSpecs?.forEach(_ => {
      tvShow.addSubtitle(season, episode, _.lang, `${tvShow.id}/${season}/${episode}/subtitles/${SubsLangCodes[_.lang.code]['langTag']}.vtt`);
    })
    await docClient.put({ TableName: dynamodbTvShowTableName, Item: tvShow });
    return;
  }
  
  throw new FailedToGetMovieOrTvShowTranscodingJobError();
};

class FailedToGetMovieOrTvShowTranscodingJobError extends Error {};

class FailedToGetMovieError extends Error {};

class FailedToGetTvShowError extends Error {};
