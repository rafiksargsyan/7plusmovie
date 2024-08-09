import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { InvocationType, InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { RicRelease, createAudioTranscodeSpec, releaseContainsEnglishAudio, releaseContainsRussianAudio, resolveResolutions } from "../movieNewReleaseChecker"
import { TvShowRepository } from '../../../adapters/TvShowRepository'
import { TvShow } from '../../domain/aggregate/TvShow'
import { ReleaseRead } from '../../domain/entity/Release'
import { Resolution as ResolutionEnum } from "../../domain/Resolution"
import { RipType } from '../../domain/RipType'
import { CreateTvShowTranscodingJobParam, handler as createTvShowTranscodingJob } from './createTvShowTranscodingJob'

const ricGetTvShowSeasonLambdaName = process.env.RIC_GET_TVSHOW_SEASON_LAMBDA_NAME!
const rawMediaFilesBaseUrl = process.env.RAW_MEDIA_FILES_BASE_URL!

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions }

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig)
const tvShowRepo = new TvShowRepository(docClient)
const lambdaClient = new LambdaClient({})

interface RicEpisode {
  [releaseId:string]: {
    replacedReleaseIds: string,
    release: RicRelease
  }
}

interface RicGetTvShowSeasonResponse {
  [episodeNumber:number]: RicEpisode
}

interface Param {
  tvShowId: string
  seasonNumber: number
}

export const handler = async (event: Param): Promise<void> => {
  const tvShow = await tvShowRepo.getSeason(event.tvShowId, event.seasonNumber)
  const season = tvShow.getSeasonOrThrow(event.seasonNumber)
  if (tvShow.ricTvShowId == null) {
    console.warn(`ricTvShowId is null for tvShowId=${event.tvShowId}`)
    return
  }
  const lambdaParams = {
    FunctionName: ricGetTvShowSeasonLambdaName,
    InvocationType: InvocationType.RequestResponse,
    Payload: JSON.stringify({ tvShowId: tvShow.ricTvShowId, seasonNumber: event.seasonNumber })
  };
  const invokeCommand = new InvokeCommand(lambdaParams)
  const response = await lambdaClient.send(invokeCommand)
  const payloadStr = Buffer.from(response.Payload!).toString()
  const payload: RicGetTvShowSeasonResponse = JSON.parse(payloadStr)
  for (const e of season.episodes) {
    if (e.monitorReleases && !e.inTranscoding) {
      const k = chooseReleaseToTranscode(payload[e.episodeNumber], tvShow, season.seasonNumber, e.episodeNumber)
      if (k == null) continue
      const r = payload[e.episodeNumber][k]
      const ricReplacedIds = r.replacedReleaseIds
      const replacedIds: string[] = []
      for (const k1 in e.releases) {
        const r1: ReleaseRead = e.releases[k1] as unknown as ReleaseRead
        if (r1._releaseIndexerContextId != null && ricReplacedIds.includes(r1._releaseIndexerContextId)) {
          replacedIds.push(k1)
        }
      }
      const resolution: ResolutionEnum = ResolutionEnum.fromKeyOrThrow(r.release.resolution);
      const ripType: RipType = RipType.fromKeyOrThrow(r.release.ripType);
      const transcodingJobParam: CreateTvShowTranscodingJobParam = {
        tvShowId: event.tvShowId,
        season: season.seasonNumber,
        episode: e.episodeNumber,
        mkvHttpUrl: `${rawMediaFilesBaseUrl}${r.release.cachedMediaFileRelativePath}`,
        releaseId: k,
        videoTranscodeSpec: {
          stream: 0,
          resolutions: resolveResolutions(RipType.fromKeyOrThrow(r.release.ripType),
          ResolutionEnum.fromKeyOrThrow(r.release.resolution)).map(r => ({ resolution: r })),
        },
        audioTranscodeSpecParams: createAudioTranscodeSpec(ripType, r.release.audios),
        textTranscodeSpecParams: r.release.subs.map(s => ({
          stream: s.stream,
          lang: s.lang,
          type: s.type
        })),
        releasesToBeRemoved: replacedIds,
        ripType: ripType.key,
        resolution: resolution.key,
        ricReleaseId: k,
        thumbnailResolutions: [ 60, 120, 240 ]
      }
      await createTvShowTranscodingJob(transcodingJobParam)
      break
    }
  }
};

function chooseReleaseToTranscode(response: RicEpisode, tvShow: TvShow, seasonNumber: number, episodeNumber: number) {
  for (const k in response.releases) {
    const r = response.releases[k].release
    if (releaseContainsRussianAudio(r) && !tvShow.releaseAlreadyExists(seasonNumber, episodeNumber, k)) {
      return k
    }
  }
  for (const k in response.releases) {
    const r = response.releases[k].release
    if (releaseContainsEnglishAudio(r) && !tvShow.releaseAlreadyExists(seasonNumber, episodeNumber, k)) {
      return k
    }
  }
  for (const k in response.releases) {
    const r = response.releases[k].release
    if (!tvShow.releaseAlreadyExists(seasonNumber, episodeNumber, k)) {
      return k
    }
  }
  return null
}
