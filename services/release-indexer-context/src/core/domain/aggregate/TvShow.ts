import { Nullable } from "../../../Nullable";
import { strIsBlank } from "../../../utils";
import { Release } from "../entity/Release";
import { ReleaseCandidate } from "../entity/ReleaseCandidate";
import { L8nLang } from "../value-object/L8nLang";
import { v4 as uuid } from 'uuid';

interface Season {
  names: string[];
  tmdbSeasonNumber: Nullable<number>;
  episodes: Episode[];
  seasonNumber: number;
}

interface Episode {
  names: string[];
  releases: { [releaseId:string]: { release: Release, replacedReleaseIds: string[] } }
  tmdbEpisodeNumber: Nullable<number>;
  episodeNumber: number;
  airDateInMillis: Nullable<number>;
  forceScan: boolean;
  blackList: string[];
  whiteList: string[];
  alreadyAddedSonarrReleaseGuidList: string[];
  lastReleaseCandidateScanTimeMillis: number;
  readyToBeProcessed: boolean;
  releaseCandidates: { [key:string]: ReleaseCandidate };
  runtimeSeconds: Nullable<number>;
}

export class TvShow {
  private _id: string;
  private _creationTime: number;
  private _tmdbId: Nullable<string>;
  private _originalLocale: L8nLang;
  private _originalTitle: string;
  private _releaseYear: number;
  private _seasons: Season[] = [];

  private constructor(createEmptyObject: boolean, originalLocale: Nullable<L8nLang>,
    originalTitle: Nullable<string>, releaseYear: Nullable<number>) {
    if (!createEmptyObject) {
      this._id = uuid();
      this.checkAndSetOriginalLocale(originalLocale);
      this.checkAndSetOriginalTitle(originalTitle);
      this.checkAndSetReleaseYear(releaseYear);
      this._creationTime = Date.now();  
    }
  }

  private checkAndSetOriginalLocale(originalLocale: Nullable<L8nLang>) {
    if (originalLocale == null) {
      throw new TvShow_NullOriginalLocaleError();
    }
    this._originalLocale = originalLocale;
  }

  private checkAndSetOriginalTitle(originalTitle: Nullable<string>) {
    if (strIsBlank(originalTitle)) {
      throw new TvShow_BlankOriginalTitleError();
    }
    this._originalTitle = originalTitle!;
  }

  private checkAndSetReleaseYear(releaseYear: Nullable<number>) {
    if (releaseYear == null || releaseYear < 0 || !Number.isInteger(releaseYear)) {
      throw new TvShow_InvalidReleaseYearError();
    }
    this._releaseYear = releaseYear;
  }

  /**
   * @param createEmptyObject
   * @param originalLocale
   * @param originalTitle
   * @param releaseYear
   * 
   * @throws {TvShow_NullOriginalLocaleError}
   * @throws {TvShow_BlankOriginalTitleError}
   * @throws {TvShow_InvalidReleaseYearError}
   */
  static create(originalLocale: L8nLang, originalTitle: string, releaseYear: number) {
    return new TvShow(false, originalLocale, originalTitle, releaseYear);
  }

  static createEmpty() {
    return new TvShow(true, null, null, null);
  }

  /**
   * @param tmdbId 
   * 
   * @throws {TvShow_NullTmdbIdError}
   */
  setTmdbId(tmdbId: string) {
    if (strIsBlank(tmdbId)) {
      throw new TvShow_BlankTmdbIdError();
    }
    if (tmdbId == this._tmdbId) return false;
    this._tmdbId = tmdbId;
    return true;
  }
  
  private getSeason(seasonNumber: number) {
    for (const s of this._seasons) {
      if (s.seasonNumber === seasonNumber) {
        return s;
      }
    }
    return null;
  }

  createSeason(seasonNumber: number) {
    if (seasonNumber == null || seasonNumber < 0 || !Number.isInteger(seasonNumber)) {
      throw new TvShow_InvalidSeasonNumberError();  
    }
    if (this.getSeason(seasonNumber) != null) {
      throw new TvShow_SeasonAlreadyExistsError();
    }
    this._seasons.push({
      seasonNumber: seasonNumber,
      episodes: [],
      names: [],
      tmdbSeasonNumber: null   
    })
  }

  private getSeasonByTmdbSeasonNumber(tmdbSeasonNumber: number) {
    for (const s of this._seasons) {
      if (s.tmdbSeasonNumber === tmdbSeasonNumber) {
        return s;
      }
    }
    return null;
  }

  setTmdbSeasonNumber(seasonNumber: number, tmdbSeasonNumber: number) {
    const season: Nullable<Season> = this.getSeason(seasonNumber);
    if (season == null) {
      throw new TvShow_SeasonNotFoundError();  
    }
    if (tmdbSeasonNumber == null || tmdbSeasonNumber < 0 || !Number.isInteger(tmdbSeasonNumber)) {
        throw new TvShow_InvalidTmdbSeasonNumberError();  
      }
    if (this.getSeasonByTmdbSeasonNumber(tmdbSeasonNumber) != null) {
      throw new TvShow_SeasonWithTmdbSeasonNumberAlreadyExistsError();
    }
    if (season.tmdbSeasonNumber !== tmdbSeasonNumber) {
      season.tmdbSeasonNumber = tmdbSeasonNumber;
      return true;
    }
    return false;
  }
}

export class TvShow_NullOriginalLocaleError {};
export class TvShow_BlankOriginalTitleError {};
export class TvShow_InvalidReleaseYearError {};
export class TvShow_BlankTmdbIdError {};
export class TvShow_InvalidSeasonNumberError {};
export class TvShow_SeasonAlreadyExistsError {};
export class TvShow_SeasonNotFoundError {};
export class TvShow_SeasonWithTmdbSeasonNumberAlreadyExistsError {};
export class TvShow_InvalidTmdbSeasonNumberError {};
