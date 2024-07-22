import { Movie } from "../domain/aggregate/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { L8nLang } from "../domain/value-object/L8nLang";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

interface CreateMovieParam {
  originalLocale: string;
  originalTitle: string;
  releaseYear: number;
}

export const handler = async (event: CreateMovieParam): Promise<string> => {
  let movie = new Movie(false, L8nLang.fromKeyOrThrow(event.originalLocale), event.originalTitle, event.releaseYear);
  await docClient.put({TableName: dynamodbMovieTableName, Item: movie});
  return movie.id;
};
