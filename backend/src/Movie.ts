import { v4 as uuid } from 'uuid';
import { L8nLangCode } from './L8nLangCodes';

type RelativePath = string;

export class Movie {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private originalLocale: L8nLangCode;
  private originalTitle: string;
  private posterImagesPortrait: { [key: string]: RelativePath };
  private posterImagesLandscape: { [key: string]: RelativePath };
  private subtitles: { [key: string]: RelativePath };
  private mpdFile: RelativePath;
  private releaseYear: number;

  public constructor(originalLocale: L8nLangCode, originalTitle: string, releaseYear: number) {
    this.id = uuid();
    this.originalLocale = originalLocale;
    this.originalTitle = this.validateTitle(originalTitle);
    this.releaseYear = this.validateReleaseYear(releaseYear);
    this.creationTime = Date.now();
    this.lastUpdateTime = this.creationTime;
  }

  private validateTitle(title: string) {
    if (! /\S/.test(title)) {
      throw new InvalidTitleError();
    }
    return title.trim();
  }

  private validateReleaseYear(releaseYear: number) {
    if (!Number.isInteger(releaseYear) || releaseYear < 1895 || releaseYear > new Date().getFullYear()) {
        throw new InvalidReleaseYearError();
    }
    return releaseYear;
  }

  public addPosterImagePortrait(locale: L8nLangCode, relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidPosterImageRelativePath();
    }
    this.posterImagesPortrait[locale.code] = relativePath;
    this.lastUpdateTime = Date.now();
  }

  public addMpdFile(relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
        throw new InvalidMpdFileRelativePath();
      }
    this.mpdFile = relativePath;
    this.lastUpdateTime = Date.now();
  }
}

class InvalidTitleError extends Error {}

class InvalidReleaseYearError extends Error {}

class InvalidPosterImageRelativePath extends Error {}

class InvalidMpdFileRelativePath extends Error {}
