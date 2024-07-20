import { TvShow } from "../domain/aggregate/TvShow";

export interface ITvShowRepository {
  getTvShowById(id: string | undefined) : Promise<TvShow>;
  saveTvShow(t: TvShow);
}

