import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { InvocationType, InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { TvShowRepository } from '../../../adapters/TvShowRepository'
import { TvShowRead } from './tvShowUpdateHandler'

const tvShowNewReleaseCheckerLambda = process.env.TVSHOW_NEW_RELEASE_CHECKER_LAMBDA!

const marshallOptions = {
  convertClassInstanceToMap: true
}

const translateConfig = { marshallOptions }
  
const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig)
const tvShowRepo = new TvShowRepository(docClient)
const lambdaClient = new LambdaClient({})

export const handler = async () => {
  const tvShows = await tvShowRepo.getAll()
  for (const tvShow of tvShows) {
    const tvShowId = tvShow.id
    const seasons = (tvShow as any as TvShowRead).seasons
    for (const s of seasons) {
      const lambdaParams = {
        FunctionName: tvShowNewReleaseCheckerLambda,
        InvocationType: InvocationType.Event,
        Payload: JSON.stringify({
          tvShowId: tvShowId,
          seasonNumber: s.seasonNumber
        })
      }
      const invokeCommand = new InvokeCommand(lambdaParams)
      await lambdaClient.send(invokeCommand) 
    }
  }
}