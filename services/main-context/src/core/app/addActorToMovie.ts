import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { Person, Persons } from "../domain/Persons";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface AddActorParam {
  movieId: string;
  actor: keyof typeof Persons;
}

export const handler = async (event: AddActorParam): Promise<void> => {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': event.movieId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, data.Item);  
  movie.addActor(new Person(event.actor));
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
};

class FailedToGetMovieError extends Error {}
