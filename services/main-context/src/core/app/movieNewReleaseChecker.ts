import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { AudioTranscodeSpecParam, CreateMovieTranscodingJobParam } from "./createMovieTranscodingJob";
import { ReleaseRead } from "../domain/entity/Release";
import { RipType } from "../domain/RipType";
import { Resolution as ResolutionEnum } from "../domain/Resolution";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const ricGetMovieLambdaName = process.env.RIC_GET_MOVIE_LAMBDA_NAME!;
const rawMediaAssetsS3Bucket = process.env.RAW_MEDIA_FILES_S3_BUCKET!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const lambdaClient = new LambdaClient({});

interface RicGetMovieResponse {
  releases: {
    [releaseId:string]: {
      replacedReleaseIds: string;
      cachedMediaFileRelativePath: string;
      ripType: string;
      resolution: string;
      audios: [
        {
          stream: number,
          channels: number,
          bitrate: number,
          lang: string
        }
      ],
      subs: [
        {
          stream: number,
          lang: string,
          type?: string
        }
      ]
    }
  }
}

export const handler = async (): Promise<void> => {
  const movies = await getAllMovies();
  for (const m of movies) {
    if (m.monitorReleases && !m.inTranscoding && m.ricMovieId != null) {
      const lambdaParams = {
      FunctionName: ricGetMovieLambdaName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ movieId: m.ricMovieId })
      };
      const invokeCommand = new InvokeCommand(lambdaParams);
      const response = await lambdaClient.send(invokeCommand);
      const payloadStr = Buffer.from(response.Payload!).toString();
      const payload: RicGetMovieResponse = JSON.parse(payloadStr);
      for (const k in payload.releases) {
        const r = payload.releases[k];
        let releaseAlreadyExists = false;
        for (const k1 in (m as any).releases) {
          const r1: ReleaseRead = ((m as any).releases)[k1];
          if (k === r1._releaseIndexerContextId) {
            releaseAlreadyExists = true;
            break;
          }
        }
        if (!releaseAlreadyExists) {
          const ricReplacedIds = r.replacedReleaseIds;
          const replacedIds: string[] = [];
          for (const k1 in (m as { [key:string]: any }).releases) {
            const r1: ReleaseRead = ((m as any).releases)[k1];
            if (r1._releaseIndexerContextId != null && ricReplacedIds.includes(r1._releaseIndexerContextId)) {
              replacedIds.push(k1);
            }
          }
          const resolution: ResolutionEnum = ResolutionEnum.fromKeyOrThrow(r.resolution);
          const ripType: RipType = RipType.fromKeyOrThrow(r.ripType);
          const createMovieTranscodingJobParam: CreateMovieTranscodingJobParam = {
            movieId: m.id,
            mkvHttpUrl: `https://${rawMediaAssetsS3Bucket}/${r.cachedMediaFileRelativePath}`,
            releaseId: k,
            videoTranscodeSpec: {
              stream: 0,
              resolutions: resolveResolutions(RipType.fromKeyOrThrow(r.ripType),
              ResolutionEnum.fromKeyOrThrow(r.resolution)).map(r => ({ resolution: r })),
            },
            audioTranscodeSpecParams: createAudioTranscodeSpec(r.audios),
            textTranscodeSpecParams: r.subs.map(s => ({
              stream: s.stream,
              lang: s.lang,
              type: s.type
            })),
            releasesToBeRemoved: replacedIds,
            ripType: ripType.key,
            resolution: resolution.key,

          }
          break;
        }
      }  
    }
  }
};

function createAudioTranscodeSpec(audios: [{ stream: number, channels: number, bitrate: number, lang: string }]) {
  const audioTranscodeSpec: AudioTranscodeSpecParam[] = [];
  for (const a of audios) {
    if (a.channels === 1) {
      audioTranscodeSpec.push({
        stream: a.stream,
        bitrate: `${Math.min(128, Math.round(a.bitrate/1000))}k`,
        channels: 1,
        lang: a.lang
      })  
    } else {
      if (a.channels >= 2) {
        audioTranscodeSpec.push({
          stream: a.stream,
          bitrate: `${Math.min(192, Math.round(a.bitrate/1000))}k`,
          channels: 2,
          lang: a.lang
        })
      }
      if (a.channels >= 6) {
        audioTranscodeSpec.push({
          stream: a.stream,
          bitrate: `${Math.min(640, Math.round(a.bitrate/1000))}k`,
          channels: 6,
          lang: a.lang
        })
      }
    }
  }
  return audioTranscodeSpec;
}

function resolveResolutions(ripType: RipType, resolution: ResolutionEnum) {
  if (RipType.fromKey(ripType.key)?.isLowQuality() || ResolutionEnum.compare(resolution, ResolutionEnum.SD) === 0) {
    return [ 360, 480 ];
  }
  if (ResolutionEnum.compare(resolution, ResolutionEnum.HD) === 0) {
    return [ 360, 480, 720 ];
  }
  return [ 360, 480, 720, 1080 ];
}

async function getAllMovies(): Promise<Movie[]> {
  const movies: Movie[] = [];
  const params = {
    TableName: dynamodbMovieTableName,
    ExclusiveStartKey: undefined
  }
  let items;
  do {
    items =  await docClient.scan(params);
    items.Items.forEach((item) => {
      const movie = new Movie(true);
      Object.assign(movie, item);
      movies.push(movie);
    });
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  return movies;
}
