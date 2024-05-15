// This function is written in app layer, but it probably needs to be splitted
// between app and infra layer according to hexagonal architecture's port/adapter
// model. Basically we need infrastracture part that listens transcoding context
// event and calls application logic. We might also consider this with other handlers.

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Movie } from "../domain/Movie";
import { SubsLangCode, SubsLangCodes } from "../domain/SubsLangCodes";
import { TvShowRepositoryInterface } from "../ports/TvShowRepositoryInterface";
import { TvShowRepository } from "../../adapters/TvShowRepository";
import { SubtitleType, SubtitleTypes } from "../domain/SubtitleType";
import { Subtitle } from "../domain/entity/Subtitle";

const dynamodbMovieTranscodingJobTableName = process.env.DYNAMODB_MOVIE_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbTvShowTranscodingJobTableName = process.env.DYNAMODB_TV_SHOW_TRANSCODING_JOB_TABLE_NAME!;
const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};
  
const translateConfig = { marshallOptions };
  
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface HandlerParam {
  transcodingContextJobId: string;
}

interface TextTranscodeSpec {
  stream: number;
  name: string;
  type: SubtitleType;
  lang: SubsLangCode;
}

interface MovieTranscodingJobRead {
  movieId?: string;
  textTranscodeSpecs?: TextTranscodeSpec[];
  outputFolderKey?: string;
}

interface TvShowTranscodingJobRead {
  tvShowId?: string;
  season?: number;
  episode?: number;
  textTranscodeSpecs?: TextTranscodeSpec[];
  outputFolderKey?: string;
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

    // This is not right way to update movie model as there might be extra application logic for validation, etc.
    // Right way would be calling corresponding lambda to the job and avoid app logic duplication.
    movie.addMpdFile(`${movieTranscodingJobRead.outputFolderKey}/vod/manifest.mpd`);
    movie.addM3u8File(`${movieTranscodingJobRead.outputFolderKey}/vod/master.m3u8`);
    movieTranscodingJobRead.textTranscodeSpecs?.forEach(_ => {
      const relativePath = `${movieTranscodingJobRead.outputFolderKey}/subtitles/${SubsLangCodes[_.lang.code]['langTag']}-${_.type.code}-${_.stream}.vtt`;
      movie.addSubtitle(_.name, new Subtitle(_.name, relativePath, _.lang, _.type));
    })
    movie.addThumbnailsFile(`${movieTranscodingJobRead.outputFolderKey}/thumbnails/thumbnails.vtt`);
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

    let tvShow = await tvShowRepo.getTvShowById(tvShowTranscodingJobRead.tvShowId);

    const season = tvShowTranscodingJobRead.season;
    const episode = tvShowTranscodingJobRead.episode;
    // This is not right way to update tvShow model as there might be extra application logic for validation, etc.
    // Right way would be calling corresponding lambda to the job and avoid app logic duplication. 
    tvShow.addMpdFile(season, episode, `${tvShowTranscodingJobRead.outputFolderKey}/vod/manifest.mpd`);
    tvShow.addM3u8File(season, episode, `${tvShowTranscodingJobRead.outputFolderKey}/vod/master.m3u8`);
    tvShowTranscodingJobRead.textTranscodeSpecs?.forEach(_ => {
      const relativePath = `${tvShowTranscodingJobRead.outputFolderKey}/subtitles/${SubsLangCodes[_.lang.code]['langTag']}-${_.type.code}-${_.stream}.vtt`;
      tvShow.addSubtitle(season, episode, _.name, new Subtitle(_.name, relativePath, _.lang, _.type));
    })
    tvShow.addThumbnailsFile(season, episode, `${tvShowTranscodingJobRead.outputFolderKey}/thumbnails/thumbnails.vtt`);
    await tvShowRepo.saveTvShow(tvShow);
    return;
  }
  
  throw new FailedToGetMovieOrTvShowTranscodingJobError();
};

class FailedToGetMovieOrTvShowTranscodingJobError extends Error {};

class FailedToGetMovieError extends Error {};
