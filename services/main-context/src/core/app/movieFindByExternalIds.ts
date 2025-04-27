import { MovieRepository } from "../../adapters/MovieRepository";
import { Nullable } from "../../utils";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const movieRepo = new MovieRepository(dynamodbMovieTableName)

interface Param {
  tmdbId: Nullable<number>;
  imdbId: Nullable<string>;
}

export const handler = async (event: Param): Promise<Nullable<string>> => {
  if (event.tmdbId != null) {
    return await movieRepo.findMovieByTmdbId(event.tmdbId);
  }
  if (event.imdbId != null) {
    return await movieRepo.findMovieByImdbId(event.imdbId);
  }
  return null;
};
