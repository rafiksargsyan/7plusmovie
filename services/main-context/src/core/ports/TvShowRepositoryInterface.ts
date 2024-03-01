import { TvShow } from "../domain/TvShow";

export interface TvShowRepositoryInterface {
  getTvShowById(id: string | undefined) : Promise<TvShow>;
  saveTvShow(tvShow: TvShow);
}
