import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);

const snsClient = new SNSClient();

const snsTopicArn = process.env.MOVIE_RELEASE_CANDIDATE_UPDATER_FANOUT_TOPIC!;

export const handler = async (): Promise<void> => {
  const movies = await movieRepo.getAllMovies();
  for (const m of movies) {
    m.checkAndEmptyReleaseCandidates(false);
    if (Object.entries(m.releaseCandidates).length !== 0 ) continue;
    if (Object.entries(m.releases).length !== 0) {
      if (new Date().getFullYear() - m.releaseYear > 1) {
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
