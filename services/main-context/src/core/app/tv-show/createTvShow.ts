import { TvShow } from "../../domain/TvShow";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { L8nLangCode } from "../../domain/L8nLangCodes";
import algoliasearch from 'algoliasearch/lite';

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const algoliaSearchOnlyClient = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_SEARCH_ONLY_KEY!);
const algoliaIndex = algoliaSearchOnlyClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);

interface CreateTvShowParam {
  originalLocale: string;
  originalTitle: string;
  releaseYear: number;
}

export const handler = async (event: CreateTvShowParam): Promise<string> => {
  // TODO: Check if a TV show with the same title and year already exists. 
  //       Currently just looking in Algolia. Yeah, now I miss about SQL :). Best solution
  //       would be to create secondary index, but to handle ignore case we will need to
  //       keep originalTitle also in all lower case or all upper case format.
  let tvShow = new TvShow(false, new L8nLangCode(event.originalLocale), event.originalTitle, event.releaseYear);
  let searchResult = await algoliaIndex.search(event.originalTitle);
  let hits = searchResult.hits;
  for (const i in hits) {
    const xOriginalTitle = hits[i]['originalTitle'] as string;
    const xReleaseYear = hits[i]['releaseYear'] as number;
    const category = hits[i]['category'] as string; 
    if (xOriginalTitle.toUpperCase() === event.originalTitle.toUpperCase() &&
      xReleaseYear === event.releaseYear && category == 'TV_SHOW') {
        throw new TvShowAlreadyExistsError();
    }
  }
  await docClient.put({TableName: dynamodbTvShowTableName, Item: tvShow});

  return tvShow.id;
};

class TvShowAlreadyExistsError extends Error {};
