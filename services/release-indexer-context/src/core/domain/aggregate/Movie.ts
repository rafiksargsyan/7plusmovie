import { Nullable } from "../../../Nullable";
import { Release } from "../entity/Release";
import { v4 as uuid } from 'uuid';
import { L8nLang } from "../value-object/L8nLang";

export class Movie {
  private _id: string;
  private _creationTime: number;
  private _tmdbId: string;
  private _originalLocale: L8nLang;
  private _originalTitle: string;
  private _releaseYear: number;
  private _releases: { [releaseId:string]: { equalReleases: Release[], replacedReleaseIds: string[] } } = {};

  public constructor(createEmptyObject: boolean, originalLocale?: Nullable<L8nLang>, originalTitle?: Nullable<string>,
    releaseYear?: Nullable<number>) {
    if (!createEmptyObject) {
      this._id = uuid();
      this._originalLocale = this.validateOriginalLocale(originalLocale);
      this._originalTitle = this.validateTitle(originalTitle);
      this._releaseYear = this.validateReleaseYear(releaseYear);
      this._creationTime = Date.now();
    }
  }

  get id() {
    return this._id;
  }

  private validateOriginalLocale(origianlLocale: Nullable<L8nLang>) {
    if (origianlLocale == undefined) {
      throw new InvalidOriginalLocaleError();
    }
    return origianlLocale;
  }

  private validateTitle(title: Nullable<string>) {
    if (title == undefined || ! /\S/.test(title)) {
      throw new InvalidTitleError();
    }
    return title.trim();
  }

  private validateReleaseYear(releaseYear: Nullable<number>) {
    if (releaseYear == undefined || !Number.isInteger(releaseYear) || releaseYear < 1895 || releaseYear > new Date().getFullYear()) {
      throw new InvalidReleaseYearError();
    }
    return releaseYear;
  }

  set tmdbId(tmdbId: Nullable<string>) {
    if (tmdbId == null) {
      throw new NullTmdbIdError();
    }
    this._tmdbId = tmdbId;
  }

  public addRelease(id: Nullable<string>, r: Nullable<Release>) {
    if (id == null) {
      throw new NullReleaseIdError();
    }
    if (r == null) { 
      throw new NullReleaseError();
    }
    if (id in this._releases) {
      throw new ReleaseWithIdAlreadyExistsError();
    }
    for (let k in this._releases) {
      const compareResult = Release.compare(this._releases[k].equalReleases[0], r);
      if (compareResult == null) {
        continue;
      }
      if (compareResult === 0) {
        for (let x of this._releases[k].equalReleases) {
          if (x.hash === r.hash) return;
        }
        this._releases[k].equalReleases.push(r);
        return;
      }
      if (compareResult > 0) {
        return;
      }
      if (compareResult < 0) {
        if (id ! in this._releases) {
          this._releases[id] = { equalReleases: [r], replacedReleaseIds: [] }
        }
        this._releases[id].replacedReleaseIds.push(k);
        this._releases[id].replacedReleaseIds.push(...this._releases[k].replacedReleaseIds);
        delete this._releases[k];
      }
    }
    if (id ! in this._releases) {
      this._releases[id] = { equalReleases: [r], replacedReleaseIds: [] }
    }
  }
}

export class NullReleaseIdError extends Error {};

export class NullReleaseError extends Error {};

export class ReleaseWithIdAlreadyExistsError extends Error {};

export class NullTmdbIdError extends Error {};

export class InvalidOriginalLocaleError extends Error {};

export class InvalidTitleError extends Error {};

export class InvalidReleaseYearError extends Error {};
