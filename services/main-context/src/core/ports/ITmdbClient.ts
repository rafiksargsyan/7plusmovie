import { Nullable } from "../../Nullable";

export type TvShowExternalIds = {
  imdbId: Nullable<string>,
  tvdbId: Nullable<number>
};

export interface ITmdbClient {
  getTvShowExternalIds(id: number): Promise<TvShowExternalIds>;
  getIdByTvdbId(id: number): Promise<number>;
};
