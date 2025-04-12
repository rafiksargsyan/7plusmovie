import { Nullable } from "../../Nullable";

export type TvShow = {
  id: number;
  name: Nullable<string>;
  nameTranslations: string[]; // eng, rus, etc. See https://thetvdb.github.io/v4-api/#/Languages for more info
};

export type TvShowTranslation = {
  name: Nullable<string>;
};

export type Episode = {
  id: number,
  aired: Nullable<string>, // e.g "1987-06-21"
  runtimeMinutes: Nullable<number>,
  seasonNumber: number,
  number: number
}

export interface ITvdbClient {
  getTvShowById(id: number): Promise<TvShow>;
  getTvShowTranslation(id: number, lang: string): Promise<TvShowTranslation>;
  getTvShowEpisodes(id: number): Promise<Episode[]>
};
