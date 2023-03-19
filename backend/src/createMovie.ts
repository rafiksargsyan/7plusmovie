import { Movie } from "./Movie";
import { DynamoDB } from 'aws-sdk';
import { L8nLangCode } from "./L8nLangCodes";

const docClient = new DynamoDB.DocumentClient();

interface CreateMovieParam {
  originalLocale: string;
  originalTitle: string;
  releaseYear: number;
}

export const handler = async (event: CreateMovieParam): Promise<string> => {

  let movie = new Movie(false, new L8nLangCode(event.originalLocale), event.originalTitle, event.releaseYear);

  await docClient.put({TableName: process.env.DYNAMODB_MOVIE_TABLE_NAME!, Item: movie}).promise();

  return movie.id;
};
