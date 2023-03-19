import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';

const marshaller = new Marshaller();
const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_ADMIN_KEY!);
const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);

interface Movie {
  id: string;
  originalTitle: string;
  posterImagesPortrait: { [key: string]: string };
  subtitles: { [key: string]: string };
  releaseYear: number;
  titleL8ns: { [key: string]: string }
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  for (const record of event.Records) {
    let movie: Movie = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as Movie;
    await algoliaIndex.saveObject({ objectID: movie.id,
                                    category: "MOVIE",
                                    originalTitle: movie.originalTitle,
                                    posterImagesPortrait: movie.posterImagesPortrait,
                                    titleL8ns: movie.titleL8ns,
                                    releaseYear: movie.releaseYear });
  }
};
