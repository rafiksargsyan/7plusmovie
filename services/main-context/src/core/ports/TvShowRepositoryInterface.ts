import { TvShow } from "../domain/TvShow";

export interface TvShowRepositoryInterface {
  getTvShowById(id: string) : TvShow;
  saveTvShow(tvShow: TvShow);
}
