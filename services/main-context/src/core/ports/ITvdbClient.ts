import { Nullable } from "../../utils";


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
  number: number,
  name: Nullable<string>,
  image: Nullable<string>,
  nameTranslations: string[]
}

export type Season = {
  id: number,
  number: number,
  name: Nullable<string>,
  image: Nullable<string>,
  episodes: Episode[]
}

export interface ITvdbClient {
  getTvShowById(id: number): Promise<TvShow>;
  getTvShowTranslation(id: number, lang: string): Promise<TvShowTranslation>;
  getTvShowSeasons(id: number): Promise<Season[]>
  getEpisodeNameTranslation(id: number, lang: string): Promise<Nullable<string>>
};
