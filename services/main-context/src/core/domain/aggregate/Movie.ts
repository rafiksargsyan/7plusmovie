import { v4 as uuid } from 'uuid';
import { L8nLangCode } from '../L8nLangCodes';
import { MovieGenre } from '../MovieGenres';
import { Person } from '../Persons';
import { Release, ReleaseRead } from '../entity/Release';
import { strIsBlank } from '../../../utils';

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
  private releaseYear: number;
  private genres: MovieGenre[] = [];
  private actors: Person[] = [];
  private directors: Person[] = [];
  private tmdbId: string;
  private releases: { [key: string]: Release } = {};
  private _monitorReleases: boolean;
  private releaseIndexerContextMovieId: string;
  private _inTranscoding: boolean = false;

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
    this.touch();
  }

  public addBackdropImage(relativePath: RelativePath) {
    if (! /\S/.test(relativePath)) {
      throw new InvalidBackdropImageRelativePathError();
    }
    this.backdropImage = relativePath;
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

  public addGenre(genre: MovieGenre): boolean {
    for (const g of this.genres) {
      if (genre.code === g.code) {
        return false;
      }
    }
    this.genres.push(genre);
    this.touch();
    return true;
  }

  public addActor(actor: Person): boolean {
    for (const a of this.actors) {
      if (actor.code === a.code) {
        return false;
      }
    }  
    this.actors.push(actor);
    this.touch();
    return true;
  }

  public addDirector(director: Person): boolean {
    for (const d of this.directors) {
      if (director.code === d.code) {
        return false;
      }
    }
    this.directors.push(director);
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

  public addRelease(key?: string, r?: Release) {
    if (strIsBlank(key)) {
      throw new NullReleaseKeyError();
    }
    if (r == null) {
      throw new NullReleaseError();
    }
    const trimmedKey = key!.trim();
    if (trimmedKey in this.releases) {
      throw new ReleaseWithKeyAlreadyExistsError();
    }
    this.releases[trimmedKey] = r;
    this.touch();
  }

  public removeRelease(key?: string) {
    if (strIsBlank(key)) {
      throw new NullReleaseKeyError();
    }
    delete this.releases[key!.trim()];
    this.touch();
  }

  public getRelease(key?: string) {
    if (strIsBlank(key)) return null;
    return this.releases[key!];
  }

  public addRICMovieId(id: string) {
    if (strIsBlank(id)) {
      throw new BlankRICMovieIdError();
    }
    this.releaseIndexerContextMovieId = id;
  }

  public transcodingStarted() {
    this._inTranscoding = true;
  }

  public transcodingFinished() {
    this._inTranscoding = false;
  }

  get inTranscoding() {
    return this._inTranscoding;
  }

  public enableMonitorReleases() {
    this._monitorReleases = true;
  }

  public disableMonitorReleases() {
    this._monitorReleases = false;
  }

  get monitorReleases() {
    return this._monitorReleases;
  }

  get ricMovieId() {
    return this.releaseIndexerContextMovieId;
  }

  public releaseAlreadyExists(ricReleasId: string) {
    for (const k in this.releases) {
      const r = this.releases[k] as unknown as ReleaseRead;
      if (ricReleasId === r._releaseIndexerContextId) {
        return true;
      }
    }
    return false;
  }
}

class NullReleaseKeyError extends Error {}

class NullReleaseError extends Error {}

class ReleaseWithKeyAlreadyExistsError extends Error {}

class InvalidTitleError extends Error {}

class InvalidReleaseYearError extends Error {}

class InvalidPosterImageRelativePathError extends Error {}

class InvalidOriginalLocaleError extends Error {}

class InvalidTitleL8nError extends Error {}

class InvalidBackdropImageRelativePathError extends Error {}

class InvalidTmdbIdError extends Error {}

class BlankRICMovieIdError extends Error {}
