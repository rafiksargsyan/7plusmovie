import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepository } from '../../adapters/MovieRepository';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo = new MovieRepository(docClient);

const snsClient = new SNSClient();

const snsTopicArn = process.env.MOVIE_RELEASE_CANDIDATE_UPDATER_FANOUT_TOPIC!;

export const handler = async (): Promise<void> => {
  const movies = await movieRepo.getAllMovies();
  for (const m of movies) {
    m.checkAndEmptyReleaseCandidates(false);
    await movieRepo.saveMovie(m);
    if (m.readyToBeProcessed) continue;
    if (Object.entries(m.releases).length !== 0) {
      if (Date.now() - m.releaseTimeInMillis > 12 * 30 * 24 * 60 * 60 * 1000 && !m.forceScan) {
        continue; 
      }
      if (Date.now() - m.lastRCScanTime < 24 * 60 * 60 * 1000) {
        continue;
      }
    }
    const snsParams = {
      Message: JSON.stringify({ movieId: m.id }),
      TopicArn: snsTopicArn
    }
    await snsClient.send(new PublishCommand(snsParams));
  }
};
