import { Nullable } from "../../Nullable";
import { Season, TvShow } from "../domain/aggregate/TvShow";
import { L8nLang } from "../domain/value-object/L8nLang";

export interface ITvShowRepository {
  getById(id: string | undefined) : Promise<TvShow>;
  save(t: TvShow);
}

export interface TvShowLazy {
  id: string;
  _creationTime: number;
  _tmdbId: Nullable<string>;
  _originalLocale: L8nLang;
  _originalTitle: string;
  _releaseYear: number;
}

