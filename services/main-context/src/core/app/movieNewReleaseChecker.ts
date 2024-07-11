import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { InvocationType, InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { AudioTranscodeSpecParam, CreateMovieTranscodingJobParam } from "./createMovieTranscodingJob";
import { ReleaseRead } from "../domain/entity/Release";
import { RipType } from "../domain/RipType";
import { Resolution as ResolutionEnum } from "../domain/Resolution";
import { handler as createMovieTranscodingJob } from "../app/createMovieTranscodingJob";
import { AudioLang } from "../domain/AudioLang";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const ricGetMovieLambdaName = process.env.RIC_GET_MOVIE_LAMBDA_NAME!;
const rawMediaFilesBaseUrl = process.env.RAW_MEDIA_FILES_BASE_URL!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const lambdaClient = new LambdaClient({});

interface RicRelease {
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

interface RicGetMovieResponse {
  releases: {
    [releaseId:string]: {
      replacedReleaseIds: string,
      release: RicRelease
    }  
  }
}

export const handler = async (): Promise<void> => {
  const movies = await getAllMovies();
  for (const m of movies) {
    if (m.monitorReleases && !m.inTranscoding && m.ricMovieId != null) {
      const lambdaParams = {
        FunctionName: ricGetMovieLambdaName,
        InvocationType: InvocationType.RequestResponse,
        Payload: JSON.stringify({ movieId: m.ricMovieId })
      };
      const invokeCommand = new InvokeCommand(lambdaParams);
      const response = await lambdaClient.send(invokeCommand);
      const payloadStr = Buffer.from(response.Payload!).toString();
      const payload: RicGetMovieResponse = JSON.parse(payloadStr);
      const k = chooseReleaseToTranscode(payload, m);
      if (k == null) continue;
      const r = payload.releases[k];
      const ricReplacedIds = r.replacedReleaseIds;
      const replacedIds: string[] = [];
      for (const k1 in (m as { [key:string]: any }).releases) {
        const r1: ReleaseRead = ((m as any).releases)[k1];
        if (r1._releaseIndexerContextId != null && ricReplacedIds.includes(r1._releaseIndexerContextId)) {
          replacedIds.push(k1);
        }
      }
      const resolution: ResolutionEnum = ResolutionEnum.fromKeyOrThrow(r.release.resolution);
      const ripType: RipType = RipType.fromKeyOrThrow(r.release.ripType);
      const createMovieTranscodingJobParam: CreateMovieTranscodingJobParam = {
        movieId: m.id,
        mkvHttpUrl: `${rawMediaFilesBaseUrl}${r.release.cachedMediaFileRelativePath}`,
        releaseId: k,
        videoTranscodeSpec: {
          stream: 0,
          resolutions: resolveResolutions(RipType.fromKeyOrThrow(r.release.ripType),
          ResolutionEnum.fromKeyOrThrow(r.release.resolution)).map(r => ({ resolution: r })),
        },
        audioTranscodeSpecParams: createAudioTranscodeSpec(r.release.audios),
        textTranscodeSpecParams: r.release.subs.map(s => ({
          stream: s.stream,
          lang: s.lang,
          type: s.type
        })),
        releasesToBeRemoved: replacedIds,
        ripType: ripType.key,
        resolution: resolution.key,
        ricReleaseId: k
      }
      await createMovieTranscodingJob(createMovieTranscodingJobParam);
      break;
    }
  }
};

function chooseReleaseToTranscode(response: RicGetMovieResponse, m: Movie) {
  for (const k in response.releases) {
    const r = response.releases[k].release;
    if (releaseContainsRussianAudio(r) && !m.releaseAlreadyExists(k)) {
      return k;
    }
  }
  for (const k in response.releases) {
    const r = response.releases[k].release;
    if (releaseContainsEnglishAudio(r) && !m.releaseAlreadyExists(k)) {
      return k;
    }
  }
  for (const k in response.releases) {
    const r = response.releases[k].release;
    if (!m.releaseAlreadyExists(k)) {
      return k;
    }
  }
  return null;
}

function releaseContainsRussianAudio(release: RicRelease) {
  for (const a of release.audios) {
    if (AudioLang.looseEquals(AudioLang.fromKeyOrThrow(a.lang), AudioLang.RU)) {
      return true;
    }
  }
  return false;
}

function releaseContainsEnglishAudio(release: RicRelease) {
  for (const a of release.audios) {
    if (AudioLang.looseEquals(AudioLang.fromKeyOrThrow(a.lang), AudioLang.EN)) {
      return true;
    }
  }
  return false;
}

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
