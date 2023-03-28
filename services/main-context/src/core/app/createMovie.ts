import { Movie } from "../domain/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { L8nLangCode } from "../domain/L8nLangCodes";

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
  // TODO: Check if a movie with the same title and year already exists. Actually
  //       there have been few cases when two movies with same title had been released
  //       in the same year, but most likely we will not have such case with our movies
  let movie = new Movie(false, new L8nLangCode(event.originalLocale), event.originalTitle, event.releaseYear);
  await docClient.put({TableName: dynamodbMovieTableName, Item: movie});

  return movie.id;
};
