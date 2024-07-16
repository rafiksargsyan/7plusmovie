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
  private _seasons: Season[];

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

  
}

export class TvShow_NullOriginalLocaleError {};
export class TvShow_BlankOriginalTitleError {};
export class TvShow_InvalidReleaseYearError {};
export class TvShow_BlankTmdbIdError {};
