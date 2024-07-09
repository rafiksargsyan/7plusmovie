import { TvShow } from "../domain/aggregate/TvShow";

export interface TvShowRepositoryInterface {
  getTvShowById(id: string | undefined) : Promise<TvShow>;
  saveTvShow(tvShow: TvShow);
}
