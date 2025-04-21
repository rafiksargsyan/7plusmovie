import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { TvShowRepository } from "../../../adapters/TvShowRepository";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { Nullable } from "../../../utils";

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const tvShowRepo = new TvShowRepository(docClient);

interface Param {
  tmdbId: Nullable<number>;
  imdbId: Nullable<string>;
  tvdbId: Nullable<number>;
}

export const handler = async (event: Param): Promise<Nullable<string>> => {
  if (event.tmdbId != null) {
    return await tvShowRepo.findTvShowByTmdbId(event.tmdbId);
  }
  if (event.imdbId != null) {
    return await tvShowRepo.findTvShowByImdbId(event.imdbId);
  }
  if (event.tvdbId != null) {
    return await tvShowRepo.findTvShowByTvdbId(event.tvdbId);
  }
  return null;
};
