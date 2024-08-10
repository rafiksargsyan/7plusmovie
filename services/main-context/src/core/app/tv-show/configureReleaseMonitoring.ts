import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { Nullable } from "../../../utils"
import { TvShowRepository } from '../../../adapters/TvShowRepository'
import { TvShow } from '../../domain/aggregate/TvShow'

const marshallOptions = {
  convertClassInstanceToMap: true
}

const translateConfig = { marshallOptions }

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig)
const tvShowRepo = new TvShowRepository(docClient)

interface Param {
  tvShowId: string
  seasonNumber: Nullable<number>
  episodeNumber: Nullable<number>
  releaseMonitoring: boolean
}

export const handler = async (event: Param): Promise<void> => {
  let tvShow: TvShow
  if (event.seasonNumber == null) {
    tvShow = await tvShowRepo.getTvShowById(event.tvShowId)
  } else {
    tvShow = await tvShowRepo.getSeason(event.tvShowId, event.seasonNumber)
  }
  tvShow.setMonitorReleases(event.seasonNumber, event.episodeNumber, event.releaseMonitoring)
  if (event.seasonNumber == null) {
    await tvShowRepo.saveTvShow(tvShow)
  } else {
    await tvShowRepo.saveSeason(tvShow, false, event.seasonNumber)
  }
}
