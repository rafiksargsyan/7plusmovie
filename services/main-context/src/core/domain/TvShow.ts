import { v4 as uuid } from 'uuid';
import { L8nLangCode } from './L8nLangCodes';
import { TvShowGenre } from './TvShowGenres';
import { SubsLangCode } from './SubsLangCodes';

interface Episode {
  originalName: string;
  nameL8ns: { [key: string]: string };
  stillImage: string;
  mpdFile: string;
  m3u8File: string;
  subtitles: { [key: string]: string };
  tmdbEpisodeNumber: number;
}

interface Season {
  posterImagesPortrait: { [key: string]: string };
  posterImagesLandscape: { [key: string]: string };
  originalName: string;
  nameL8ns: { [key: string]: string };
  tmdbSeasonNumber?: number;
  episodes: Episode[];
}

export class TvShow {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private originalLocale: L8nLangCode;
  private originalTitle: string;
  private titleL8ns: { [key: string]: string } = {};
  private posterImagesPortrait: { [key: string]: string } = {};
  private posterImagesLandscape: { [key: string]: string } = {};
  private backdropImage: string;
  private releaseYear: number;
  private genres: TvShowGenre[] = [];
  private tmdbId : string;
  private seasons: Season[] = [];

  public constructor(createEmptyObject: boolean, originalLocale?: L8nLangCode, originalTitle?: string, releaseYear?: number) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.originalLocale = this.validateOriginalLocale(originalLocale);
      this.originalTitle = this.validateTitle(originalTitle);
      this.releaseYear = this.validateReleaseYear(releaseYear);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
    }
  }

  private validateOriginalLocale(origianlLocale: L8nLangCode | undefined) {
    if (origianlLocale == undefined) {
      throw new InvalidOriginalLocaleError();
    }
    return origianlLocale;
  }

  private validateTitle(title: string | undefined) {
    if (title == undefined || ! /\S/.test(title)) {
      throw new InvalidTitleError();
    }
    return title.trim();
  }

  private validateReleaseYear(releaseYear: number | undefined) {
    if (releaseYear === undefined || !Number.isInteger(releaseYear) || releaseYear < 1895 || releaseYear > new Date().getFullYear()) {
        throw new InvalidReleaseYearError();
    }
    return releaseYear;
  }

  public addPosterImagePortrait(locale: L8nLangCode, relativePath: string) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidPosterImageRelativePathError();
    }
    this.posterImagesPortrait[locale.code] = relativePath;
    this.touch();
  }

  public addSubtitle(season: number, episode: number, locale: SubsLangCode, relativePath: string) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidSubtitleRelativePathError();
    }
    this.seasons[season].episodes[episode].subtitles[locale.code] = relativePath;
    this.touch();
  }

  public addBackdropImage(relativePath: string) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidBackdropImageRelativePathError();
    }
    this.backdropImage = relativePath;
    this.touch();
  }

  public addMpdFile(season: number, episode: number, relativePath: string) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidMpdFileRelativePathError();
    }
    this.seasons[season].episodes[episode].mpdFile = relativePath;
    this.touch();
  }

  public addM3u8File(season: number, episode: number, relativePath: string) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidM3u8FileRelativePathError();
    }
    this.seasons[season].episodes[episode].m3u8File = relativePath;
    this.touch();
  }

  public addTitleL8n(locale: L8nLangCode, title: string) {
    if (! /\S/.test(title)) {
      throw new InvalidTitleL8nError();
    }
    // TODO: validate that title is in provided locale
    this.titleL8ns[locale.code] = title;
    this.touch();
  }

  public addGenre(genre: TvShowGenre): boolean {
    for (const g of this.genres) {
      if (genre.code === g.code) {
        return false;
      }
    }
    this.genres.push(genre);
    this.touch();
    return true;
  }

  public touch() {
    this.lastUpdateTime = Date.now();
  }

  public setTheMovieDbId(tmdbId: string) {
    if (! /\S/.test(tmdbId)) {
      throw new InvalidTmdbIdError();
    }
    this.tmdbId = tmdbId;
    this.touch();
  }

  public addSeason(originalName?: string) {
    if (originalName == undefined || ! /\S/.test(originalName)) {
      throw new InvalidSeasonNameError();
    }
    this.seasons.push({
      originalName: originalName,
      posterImagesPortrait: {},
      posterImagesLandscape: {},
      nameL8ns: {},
      episodes: []
    });
    this.touch();
  }

  public addPosterImagePortraitToSeason(season?: number, locale?: L8nLangCode, relativePath?: string) {
    if (season == undefined || season < 0 || season >= this.seasons.length) {
      throw new InvalidSeasonError();
    }
    if (locale == undefined) {
      throw new InvalidLocaleError();
    }
    if (relativePath == undefined || ! /\S/.test(relativePath)) {
      throw new InvalidPosterImageRelativePathError();
    }
    this.seasons[season].posterImagesPortrait[locale.code] = relativePath;
    this.touch();
  }
}

class InvalidTitleError extends Error {}

class InvalidReleaseYearError extends Error {}

class InvalidPosterImageRelativePathError extends Error {}

class InvalidMpdFileRelativePathError extends Error {}

class InvalidOriginalLocaleError extends Error {}

class InvalidTitleL8nError extends Error {}

class InvalidBackdropImageRelativePathError extends Error {}

class InvalidSubtitleRelativePathError extends Error {}

class InvalidM3u8FileRelativePathError extends Error {}

class InvalidTmdbIdError extends Error {}

class InvalidSeasonNameError extends Error {}

class InvalidSeasonError extends Error {}

class InvalidLocaleError extends Error {}
