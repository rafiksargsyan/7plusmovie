import { Movie } from "./Movie";
import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch'; 

const marshaller = new Marshaller();
const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_ADMIN_KEY!);
const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_MOVIE_INDEX!);

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    let movie: Movie = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as Movie;
    algoliaIndex.saveObject(movie);
  }
};
