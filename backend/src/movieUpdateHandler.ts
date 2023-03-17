import { Movie } from "./Movie";
import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from "aws-lambda";

const marshaller = new Marshaller();

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    let movie: Movie = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as Movie;
    // update algolia;
  }
};
