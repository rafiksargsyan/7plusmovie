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
  creationTime: number;
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

  private getSeasonOrThrow(seasonNumber: number) {
    const season = this.getSeason(seasonNumber);
    if (season == null) {
      throw new TvShow_SeasonNotFoundError();
    }
    return season;
  }

  private checkSeasonNumberOrThrow(seasonNumber: number) {
    if (seasonNumber == null || seasonNumber < 0 || !Number.isInteger(seasonNumber)) {
      throw new TvShow_InvalidSeasonNumberError();  
    }
  }

  createSeason(seasonNumber: number) {
    this.checkSeasonNumberOrThrow(seasonNumber);
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
    const season: Season = this.getSeasonOrThrow(seasonNumber);
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

  addNameToSeason(seasonNumber: number, name: string) {
    if (strIsBlank(name)) {
      throw new TvShow_BlankSeasonNameError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    name = name.trim().toLowerCase();
    if (season.names.includes(name)) return false;
    season.names.push(name);
    return true;
  }

  private checkEpisodeNumberOrThrow(episodeNumber: number) {
    if (episodeNumber == null || episodeNumber < 0 || !Number.isInteger(episodeNumber)) {
      throw new TvShow_InvalidEpisodeNumberError();  
    }
  }

  getEpisode(seasonNumber: number, episodeNumber: number) {
    this.checkSeasonNumberOrThrow(seasonNumber);
    const season = this.getSeason(seasonNumber);
    if (season == null) return null;
    this.checkEpisodeNumberOrThrow(episodeNumber);
    for (const e of season.episodes) {
      if (e.episodeNumber === episodeNumber) {
        return e;
      }
    }
    return null;
  } 

  createEpisode(seasonNumber: number, episodeNumber: number) {
    this.checkSeasonNumberOrThrow(seasonNumber);
    this.checkEpisodeNumberOrThrow(episodeNumber);
    if (this.getEpisode(seasonNumber, episodeNumber) != null) {
      throw new TvShow_EpisodeAlreadyExistsError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    season.episodes.push({
      creationTime: Date.now(),
      names: [],
      releases: {},
      tmdbEpisodeNumber: null,
      episodeNumber: episodeNumber,
      airDateInMillis: null,
      forceScan: false,
      blackList: [],
      whiteList: [],
      alreadyAddedSonarrReleaseGuidList: [],
      lastReleaseCandidateScanTimeMillis: 0,
      readyToBeProcessed: false,
      releaseCandidates: {},
      runtimeSeconds: null
    })
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
export class TvShow_BlankSeasonNameError {};
export class TvShow_InvalidEpisodeNumberError {};
export class TvShow_EpisodeAlreadyExistsError {};

