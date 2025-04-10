import { Nullable } from "../../Nullable";

export type TvShow = {
  id: number;
  name: Nullable<string>;
  nameTranslations: string[]; // eng, rus, etc. See https://thetvdb.github.io/v4-api/#/Languages for more info
};

export type TvShowTranslation = {
  name: Nullable<string>;
};

export interface ITvdbClient {
  getTvShowById(id: number): Promise<TvShow>;
  getTvShowTranslation(id: number, lang: string): Promise<TvShowTranslation>;
};
