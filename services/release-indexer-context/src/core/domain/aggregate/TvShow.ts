import { Nullable } from "../../../Nullable";
import { strIsBlank } from "../../../utils";
import { Release } from "../entity/Release";
import { ReleaseCandidate, ReleaseCandidateStatus } from "../entity/ReleaseCandidate";
import { L8nLang } from "../value-object/L8nLang";
import { v4 as uuid } from 'uuid';

export interface Season {
  tmdbSeasonNumber: Nullable<number>;
  episodes: Episode[];
  seasonNumber: number;
  alreadyAddedSonarrReleaseGuidList: string[];
  lastReleaseCandidateScanTimeMillis: number;
  readyToBeProcessed: boolean;
}

export interface Episode {
  creationTime: number;
  releases: { [releaseId:string]: { release: Release, replacedReleaseIds: string[] } }
  tmdbEpisodeNumber: Nullable<number>;
  episodeNumber: number;
  airDateInMillis: Nullable<number>;
  forceScan: boolean;
  blackList: string[];
  whiteList: string[];
  runtimeSeconds: Nullable<number>;
  releaseCandidates: { [key:string]: ReleaseCandidate };
}

export class TvShow {
  public readonly id: string;
  private _creationTime: number;
  private _tmdbId: Nullable<string>;
  private _tvdbId: Nullable<string>;
  private _originalLocale: L8nLang;
  private _originalTitle: string;
  private _releaseYear: number;
  private _seasons: Season[] = [];
  private _names: string[] = [];

  private constructor(createEmptyObject: boolean, originalLocale: Nullable<L8nLang>,
    originalTitle: Nullable<string>, releaseYear: Nullable<number>) {
    if (!createEmptyObject) {
      this.id = uuid();
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
   * @throws {TvShow_BlankTmdbIdError}
   */
  setTmdbId(tmdbId: string) {
    if (strIsBlank(tmdbId)) {
      throw new TvShow_BlankTmdbIdError();
    }
    if (tmdbId == this._tmdbId) return false;
    this._tmdbId = tmdbId;
    return true;
  }
  
  /**
   * @param tvdbId
   * 
   * @throws {TvShow_BlankTvdbIdError}
   */
  setTvdbId(tvdbId: string) {
    if (strIsBlank(tvdbId)) {
      throw new TvShow_BlankTvdbIdError();
    }
    if (tvdbId == this._tvdbId) return false;
    this._tvdbId = tvdbId;
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

  getSeasonOrThrow(seasonNumber: number) {
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

  seasonExists(seasonNumber: number) {
    return this.getSeason(seasonNumber) != null;
  }

  createSeason(seasonNumber: number) {
    this.checkSeasonNumberOrThrow(seasonNumber);
    if (this.seasonExists(seasonNumber)) {
      throw new TvShow_SeasonAlreadyExistsError();
    }
    this._seasons.push({
      seasonNumber: seasonNumber,
      episodes: [],
      tmdbSeasonNumber: null,
      alreadyAddedSonarrReleaseGuidList: [],
      lastReleaseCandidateScanTimeMillis: 0,
      readyToBeProcessed: false
    })
  }

  setTmdbSeasonNumber(seasonNumber: number, tmdbSeasonNumber: number) {
    const season: Season = this.getSeasonOrThrow(seasonNumber);
    if (tmdbSeasonNumber == null || tmdbSeasonNumber < 0 || !Number.isInteger(tmdbSeasonNumber)) {
      throw new TvShow_InvalidTmdbSeasonNumberError();  
    }
    if (season.tmdbSeasonNumber !== tmdbSeasonNumber) {
      season.tmdbSeasonNumber = tmdbSeasonNumber;
      return true;
    }
    return false;
  }

  private checkEpisodeNumberOrThrow(episodeNumber: number) {
    if (episodeNumber == null || episodeNumber < 0 || !Number.isInteger(episodeNumber)) {
      throw new TvShow_InvalidEpisodeNumberError();  
    }
  }

  private getEpisode(seasonNumber: number, episodeNumber: number) {
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

  private getEpisodeOrThrow(seasonNumber: number, episodeNumber: number) {
    const episode = this.getEpisode(seasonNumber, episodeNumber);
    if (episode == null) {
      throw new TvShow_EpisodeNotFoundError();
    }
    return episode;
  }

  episodeExists(seasonNumber: number, episodeNumber: number) {
    return this.getEpisode(seasonNumber, episodeNumber) != null;
  }

  createEpisode(seasonNumber: number, episodeNumber: number) {
    this.checkSeasonNumberOrThrow(seasonNumber);
    this.checkEpisodeNumberOrThrow(episodeNumber);
    if (this.episodeExists(seasonNumber, episodeNumber)) {
      throw new TvShow_EpisodeAlreadyExistsError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    season.episodes.push({
      creationTime: Date.now(),
      releases: {},
      tmdbEpisodeNumber: null,
      episodeNumber: episodeNumber,
      airDateInMillis: null,
      forceScan: false,
      blackList: [],
      whiteList: [],
      runtimeSeconds: null,
      releaseCandidates: {}
    })
  }

  setTmdbEpisodeNumber(seasonNumber: number, episodeNumber: number, tmdbEpisodeNumber: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (tmdbEpisodeNumber == null || tmdbEpisodeNumber < 0 || !Number.isInteger(tmdbEpisodeNumber)) {
      throw new TvShow_InvalidTmdbEpisodeNumberError();  
    }
    if (episode.tmdbEpisodeNumber !== tmdbEpisodeNumber) {
      episode.tmdbEpisodeNumber = tmdbEpisodeNumber;
      return true;
    }
    return false;
  }

  get tmdbId() {
    return this._tmdbId;
  }

  get tvdbId() {
    return this._tvdbId;
  }

  setEpisodeRuntime(seasonNumber: number, episodeNumber: number, runtimeSeconds: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (runtimeSeconds == null || runtimeSeconds <= 0) {
      throw new TvShow_InvalidEpisodeRuntimeSecondsError();
    }
    if (episode.runtimeSeconds != null && episode.runtimeSeconds > 0) return false;
    if (episode.runtimeSeconds === runtimeSeconds) return false;
    episode.runtimeSeconds = runtimeSeconds;
    return true;
  }

  setEpisodeAirDateInMillis(seasonNumber: number, episodeNumber: number, airDateInMillis: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (airDateInMillis == null || airDateInMillis <= 0) {
      throw new TvShow_InvalidEpisodeAirDateError();
    }
    if (episode.airDateInMillis === airDateInMillis) return false;
    episode.airDateInMillis = airDateInMillis;
    return true;
  }

  get seasons() {
    return this._seasons;
  }

  sonarrReleaseAlreadyAdded(seasonNumber: number, guid: string) {
    const season = this.getSeasonOrThrow(seasonNumber);
    if (strIsBlank(guid)) {
      throw new TvShow_BlankSonarrReleaseGuidError();
    }
    return season.alreadyAddedSonarrReleaseGuidList.includes(guid);
  }

  addSonarrReleaseGuid(seasonNumber: number, guid: string) {
    if (strIsBlank(guid)) {
      throw new TvShow_BlankSonarrReleaseGuidError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    season.alreadyAddedSonarrReleaseGuidList.push(guid);
  }

  estimatedLastEpisodeReleaseTime(seasonNumber): Nullable<number> {
    const season = this.getSeasonOrThrow(seasonNumber);
    let ret = 0;
    for (const e of season.episodes) {
      if (e.airDateInMillis != null) {
        ret = Math.max(ret, e.airDateInMillis);
      } else {
        ret = Math.max(ret, e.creationTime);
      }
    }
    if (ret === 0) {
      return null;
    }
    return ret;
  }

  get originalLocale() {
    return this._originalLocale;
  }

  setSeasonReadyToBeProcessed(seasonNumber: number, value: boolean) {
    const season = this.getSeasonOrThrow(seasonNumber);
    season.readyToBeProcessed = value;
    if (value) {
      season.lastReleaseCandidateScanTimeMillis = Date.now();
      season.alreadyAddedSonarrReleaseGuidList = [];
    }
  }

  addRCToSeason(seasonNumber: number, id: string, rc: ReleaseCandidate) {
    const season = this.getSeasonOrThrow(seasonNumber);
    if (strIsBlank(id)) {
      throw new TvShow_BlankRCIdError();
    }
    if (rc == null) {
      throw new TvShow_NullRCError();
    }
    const idLowerCase = id.toLowerCase();
    const idUpperCase = id.toUpperCase();
    season.episodes.forEach(e => {
      if ((!(idLowerCase in e.releaseCandidates)) && (!(idUpperCase in e.releaseCandidates))) {
        e.releaseCandidates[id] = rc;
      }
    })
  }

  addRCToEpisodes(seasonNumber: number, episodeNumbers: number[], id: string, rc: ReleaseCandidate) {
    if (strIsBlank(id)) {
      throw new TvShow_BlankRCIdError();
    }
    if (rc == null) {
      throw new TvShow_NullRCError();
    }
    for (const episodeNumber of episodeNumbers) {
     const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
     const idLowerCase = id.toLowerCase();
     const idUpperCase = id.toUpperCase();
     if ((!(idLowerCase in episode.releaseCandidates)) && (!(idUpperCase in episode.releaseCandidates))) {
       episode.releaseCandidates[id] = rc;
     }
    }
  }

  addName(name: Nullable<string>) {
    if (strIsBlank(name)) {
      return false;
    }
    name = name!.trim().toLowerCase();
    if (this._names.includes(name)) return false;
    this._names.push(name);
    return true;
  }

  get names() {
    return this._names;
  }

  public checkAndEmptyReleaseCandidates(seasonNumber: number, forceEmpty: boolean) {
    const season = this.getSeasonOrThrow(seasonNumber);
    if (forceEmpty) {
      for (const e of season.episodes) {
        e.releaseCandidates = {};
      }
      return;
    }
    for (const e of season.episodes) {
      for (const k in e.releaseCandidates) {
        if (e.releaseCandidates[k].status == null) return;
      }
    }
    for (const e of season.episodes) {
      e.releaseCandidates = {};
    }
    season.alreadyAddedSonarrReleaseGuidList = [];
    season.readyToBeProcessed = false;
  }

  public isBlackListed(seasonNumber: number, episodeNumber: number, id: string) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    return episode.blackList.includes(id);
  }

  public isWhiteListed(seasonNumber: number, episodeNumber: number, id: string) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    return episode.whiteList.includes(id);
  }

  private getReleaseCandidateOrThrow(seasonNumber: number, episodeNumber: number, id: string) {
    if (strIsBlank(id)) {
      throw new TvShow_BlankRCIdError();
    }
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    let rc = episode.releaseCandidates[id];
    if (rc == null) throw new TvShow_RCNotFoundError();
    return rc;
  }

  public ignoreRc(seasonNumber: number, episodeNumber: number, id: string) {
    let rc = this.getReleaseCandidateOrThrow(seasonNumber, episodeNumber, id)
    rc.status = ReleaseCandidateStatus.IGNORED;
    let e = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (!this.isBlackListed(seasonNumber, episodeNumber, id)) {
      e.blackList.push(id);
    }
  }

  public promoteRc(seasonNumber: number, episodeNumber: number, id: string) {
    let rc = this.getReleaseCandidateOrThrow(seasonNumber, episodeNumber, id)
    rc.status = ReleaseCandidateStatus.PROMOTED;
    let e = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (!this.isWhiteListed(seasonNumber, episodeNumber, id)) {
      e.whiteList.push(id);
    }
  }

  public addRelease(seasonNumber: number, episodeNumber: number, id: string, r: Release) {
    if (strIsBlank(id)) {
      throw new TvShow_BlankReleaseIdError();
    }
    if (r == null) { 
      throw new TvShow_NullReleaseError();
    }
    if (r.audios.length == 0) {
      throw new TvShow_NoAudioReleaseError()
    }
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (id in episode.releases) {
      throw new TvShow_ReleaseWithIdAlreadyExistsError();
    }
    for (let k of Object.keys(episode.releases)) {
      const compareResult = Release.compare(episode.releases[k].release, r);
      if (compareResult == null) {
        continue;
      }
      if (compareResult === 0) {
        if (episode.releases[k].release.hash === r.hash || Release.compare2(episode.releases[k].release, r) >= 0) return false;
        episode.releases[k].release = r;
        return true;
      }
      if (compareResult > 0) {
        return;
      }
      if (compareResult < 0) {
        if (!(id in episode.releases)) {
          episode.releases[id] = { release: r, replacedReleaseIds: [] }
        }
        episode.releases[id].replacedReleaseIds.push(k);
        episode.releases[id].replacedReleaseIds.push(...episode.releases[k].replacedReleaseIds);
        delete episode.releases[k];
      }
    }
    if (!(id in episode.releases)) {
      episode.releases[id] = { release: r, replacedReleaseIds: [] }
    }
    return true;
  }
}

export class TvShow_NullOriginalLocaleError {}
export class TvShow_BlankOriginalTitleError {}
export class TvShow_InvalidReleaseYearError {}
export class TvShow_BlankTmdbIdError {}
export class TvShow_BlankTvdbIdError {}
export class TvShow_InvalidSeasonNumberError {}
export class TvShow_SeasonAlreadyExistsError {}
export class TvShow_SeasonNotFoundError {}
export class TvShow_SeasonWithTmdbSeasonNumberAlreadyExistsError {}
export class TvShow_InvalidTmdbSeasonNumberError {}
export class TvShow_InvalidEpisodeNumberError {}
export class TvShow_EpisodeAlreadyExistsError {}
export class TvShow_EpisodeNotFoundError {}
export class TvShow_InvalidTmdbEpisodeNumberError {}
export class TvShow_InvalidEpisodeRuntimeSecondsError {}
export class TvShow_InvalidEpisodeAirDateError {}
export class TvShow_BlankSonarrReleaseGuidError {}
export class TvShow_BlankRCIdError {}
export class TvShow_NullRCError {}
export class TvShow_RCNotFoundError {}
export class TvShow_BlankReleaseIdError {}
export class TvShow_NullReleaseError {}
export class TvShow_NoAudioReleaseError {}
export class TvShow_ReleaseWithIdAlreadyExistsError {}
