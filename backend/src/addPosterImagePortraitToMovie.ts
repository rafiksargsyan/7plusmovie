import { Movie } from "./Movie";
import { DynamoDB } from 'aws-sdk';
import { L8nLangCode } from "./L8nLangCodes";
import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { AttributeMap } from "aws-sdk/clients/dynamodb";

const docClient = new DynamoDB.DocumentClient();
const marshaller = new Marshaller();

interface AddPosterImagePortraitParam {
  movieId: string;
  locale: string;
  relativePath: string;
}

export const handler = async (event: AddPosterImagePortraitParam): Promise<void> => {
  const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': event.movieId }
  } as const;
  let movie!: Movie;
  docClient.get(queryParams, function(err, data) {
    if (err) {
      throw new FailedToGetMovieError();
    } else {
      movie = marshaller.unmarshallItem(data.Item as AttributeMap) as unknown as Movie;
    }
  })
  movie.addPosterImagePortrait(new L8nLangCode(event.locale), event.relativePath);
  await docClient.put({ TableName: dynamodbMovieTableName, Item: movie }).promise();
};

class FailedToGetMovieError extends Error {}
