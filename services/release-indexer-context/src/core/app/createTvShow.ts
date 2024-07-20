import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { L8nLang } from "../domain/value-object/L8nLang";
import { TvShow } from "../domain/aggregate/TvShow";
import { TvShowRepository } from "../../adapters/TvShowRepository";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const tvShowRepo = new TvShowRepository(docClient);

interface CreateTvShowParam {
  originalLocale: string;
  originalTitle: string;
  releaseYear: number;
}

export const handler = async (event: CreateTvShowParam): Promise<string> => {
  let tvShow = TvShow.create(L8nLang.fromKeyOrThrow(event.originalLocale), event.originalTitle, event.releaseYear);
  tvShowRepo.save(tvShow);
  return tvShow.id;
}
