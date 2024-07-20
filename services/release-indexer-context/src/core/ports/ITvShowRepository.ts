import { TvShow } from "../domain/aggregate/TvShow";

export interface ITvShowRepository {
  getById(id: string | undefined) : Promise<TvShow>;
  save(t: TvShow);
}

