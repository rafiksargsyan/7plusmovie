import { Nullable } from "../../utils";


export type TvShowExternalIds = {
  imdbId: Nullable<string>,
  tvdbId: Nullable<number>,
};

export type MovieExternalIds = {
  imdbId: Nullable<string>
}

export interface ITmdbClient {
  getTvShowExternalIds(id: number): Promise<TvShowExternalIds>;
  getIdByTvdbId(id: number): Promise<number>;
  getMovieExternalIds(id: number): Promise<MovieExternalIds>;
};
