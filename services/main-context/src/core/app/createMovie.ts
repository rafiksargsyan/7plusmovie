import { Movie } from "../domain/Movie";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { L8nLangCode } from "../domain/L8nLangCodes";
import algoliasearch from 'algoliasearch/lite';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const algoliaSearchOnlyClient = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_SEARCH_ONLY_KEY!);
const algoliaIndex = algoliaSearchOnlyClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);

interface CreateMovieParam {
  originalLocale: string;
  originalTitle: string;
  releaseYear: number;
}

export const handler = async (event: CreateMovieParam): Promise<string> => {
  // TODO: Check if a movie with the same title and year already exists. Actually
  //       there have been few cases when two movies with same title had been released
  //       in the same year, but most likely we will not have such case with our movies.
  //       Currently just looking in Algolia. Yeah, now I miss about SQL ).
  let movie = new Movie(false, new L8nLangCode(event.originalLocale), event.originalTitle, event.releaseYear);
  algoliaIndex.search(event.originalTitle).then(({ hits }) => {
    hits.forEach((x) => {
      const xOriginalTitle = x['originalTitle'] as string;
      const xReleaseYear = x['releaseYear'] as number;
      if (xOriginalTitle.toUpperCase() === event.originalTitle.toUpperCase() &&
        xReleaseYear === event.releaseYear) {
          throw new MovieAlreadyExistsError();
      }
    })
  })
  await docClient.put({TableName: dynamodbMovieTableName, Item: movie});

  return movie.id;
};

class MovieAlreadyExistsError extends Error {};
