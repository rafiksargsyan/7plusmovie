import { v4 as uuid } from 'uuid';
import { L8nLangCode } from './L8nLangCodes';
import { SubsLangCode } from './SubsLangCodes';

type RelativePath = string;

export class Movie {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private originalLocale: L8nLangCode;
  private originalTitle: string;
  private titleL8ns: { [key: string]: string } = {};
  private posterImagesPortrait: { [key: string]: RelativePath } = {};
  private posterImagesLandscape: { [key: string]: RelativePath } = {};
  private backdropImage: RelativePath;
  private subtitles: { [key: string]: RelativePath } = {};
  private mpdFile: RelativePath;
  private m3u8File: RelativePath;
  private releaseYear: number;

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
    if (origianlLocale === undefined) {
      throw new InvalidOriginalLocaleError();
    }
    return origianlLocale;
  }

  private validateTitle(title: string | undefined) {
    if (title === undefined || ! /\S/.test(title)) {
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

  public addPosterImagePortrait(locale: L8nLangCode, relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidPosterImageRelativePathError();
    }
    this.posterImagesPortrait[locale.code] = relativePath;
    this.lastUpdateTime = Date.now();
  }

  public addSubtitle(locale: SubsLangCode, relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidSubtitleRelativePathError();
    }
    this.subtitles[locale.code] = relativePath;
    this.lastUpdateTime = Date.now();
  }

  public addBackdropImage(relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidBackdropImageRelativePathError();
    }
    this.backdropImage = relativePath;
    this.lastUpdateTime = Date.now();
  }

  public addMpdFile(relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
        throw new InvalidMpdFileRelativePathError();
      }
    this.mpdFile = relativePath;
    this.lastUpdateTime = Date.now();
  }

  public addM3u8File(relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
        throw new InvalidM3u8FileRelativePathError();
      }
    this.m3u8File = relativePath;
    this.lastUpdateTime = Date.now();
  }

  public addTitleL8n(locale: L8nLangCode, title: string) {
    if (! /\S/.test(title)) {
      throw new InvalidTitleL8nError();
    }
    // TODO: validate that title is in provided locale
    this.titleL8ns[locale.code] = title;
    this.lastUpdateTime = Date.now();
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
