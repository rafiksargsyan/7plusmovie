import { Nullable } from "../../Nullable";
import { TvShow } from "../domain/aggregate/TvShow";
import { L8nLang } from "../domain/value-object/L8nLang";

export interface ITvShowRepository {
  /**
   * @throws {TvShowWithIdNotFoundError}
   * @param id 
   */  
  getById(id: string | undefined) : Promise<TvShow>;
  save(t: TvShow, saveRoot: boolean, seasons: number[], episodes: { [key:number] : number [] });
  getAllLazy() : Promise<TvShowLazy[]>;
}

export interface TvShowLazy {
  id: string;
  _creationTime: number;
  _tmdbId: Nullable<string>;
  _originalLocale: L8nLang;
  _originalTitle: string;
  _releaseYear: number;
}

export class TvShowWithIdNotFoundError {};
