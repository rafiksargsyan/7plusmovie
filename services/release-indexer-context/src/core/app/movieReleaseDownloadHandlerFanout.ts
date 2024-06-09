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

const snsTopicArn = process.env.MOVIE_RELEASE_DOWNLOAD_HANDLER_FANOUT_TOPIC!;

export const handler = async (): Promise<void> => {
  const movies = await movieRepo.getAllMovies();
  for (const m of movies) {
    if (!m.readyToBeProcessed) continue;
    const snsParams = {
      Message: JSON.stringify({ movieId: m.id }),
      TopicArn: snsTopicArn
    }
    await snsClient.send(new PublishCommand(snsParams));
  }
}
