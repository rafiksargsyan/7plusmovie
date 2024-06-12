import { Nullable } from "../../../Nullable";
import { Release } from "../entity/Release";
import { v4 as uuid } from 'uuid';
import { L8nLang } from "../value-object/L8nLang";
import { ReleaseCandidate, ReleaseCandidateStatus } from "../entity/ReleaseCandidate";

export class Movie {
  private _id: string;
  private _creationTime: number;
  private _tmdbId: string;
  private _originalLocale: L8nLang;
  private _originalTitle: string;
  private _releaseYear: number;
  private _releases: { [releaseId:string]: { release: Release, replacedReleaseIds: string[] } } = {};
  private _releaseCandidates: { [key:string]: ReleaseCandidate } = {};
  private _alreadyAddedRadarrReleaseGuidList: string[] = [];
  private _blackList: string[] = [];
  private _lastReleaseCandidateScanTimeMillis = 0;
  private _readyToBeProcessed = false;
  private _releaseTimeInMillis;
  private _runtimeSeconds;
  private _alternativeTitles: string[] = [];

  public constructor(createEmptyObject: boolean, originalLocale?: L8nLang, originalTitle?: string, releaseYear?: number) {
    if (!createEmptyObject) {
      this._id = uuid();
      this._originalLocale = this.validateOriginalLocale(originalLocale);
      this._originalTitle = this.validateTitle(originalTitle);
      this._releaseYear = this.validateReleaseYear(releaseYear);
      this._creationTime = Date.now();
    }
  }
  
  get releaseYear() {
    return this._releaseYear;
  }

  get releases() {
    return this._releases;
  }

  get id() {
    return this._id;
  }

  get tmdbId() {
    return this._tmdbId;
  }

  get creationTime() {
    return this._creationTime;
  }

  get originalLocale() {
    return this._originalLocale;
  }

  get originalTitle() {
    return this._originalTitle;
  }

  get releaseTimeInMillis() {
    if (this._releaseTimeInMillis != null) return this._releaseTimeInMillis;
    return new Date(`${this._releaseYear}-01-01`).getTime();
  }

  get runtimeSeconds() {
    return this._runtimeSeconds;
  }

  get alternativeTitles() {
    return this._alternativeTitles;
  }

  set alternativeTitles(titles: string[]) {
    if (titles == null) {
      throw new NullAlternativeTitlesError();
    }
    this._alternativeTitles = titles;
  }

  set runtimeSeconds(seconds: number) {
    if (seconds == null || seconds <= 0) {
      throw new InvalidRuntimeError();
    }
    this._runtimeSeconds = seconds;
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
    if (r.audios.length == 0) {
      throw new NoAudioReleaseError();
    }
    if (id in this._releases) {
      throw new ReleaseWithIdAlreadyExistsError();
    }
    for (let k of Object.keys(this._releases)) {
      const compareResult = Release.compare(this._releases[k].release, r);
      if (compareResult == null) {
        continue;
      }
      if (compareResult === 0) {
        if (this._releases[k].release.hash === r.hash || Release.compare2(this._releases[k].release, r) >= 0) return;
        this._releases[k].release = r;
        return;
      }
      if (compareResult > 0) {
        return;
      }
      if (compareResult < 0) {
        if (!(id in this._releases)) {
          this._releases[id] = { release: r, replacedReleaseIds: [] }
        }
        this._releases[id].replacedReleaseIds.push(k);
        this._releases[id].replacedReleaseIds.push(...this._releases[k].replacedReleaseIds);
        delete this._releases[k];
      }
    }
    if (!(id in this._releases)) {
      this._releases[id] = { release: r, replacedReleaseIds: [] }
    }
  }

  public checkAndEmptyReleaseCandidates(forceEmpty: boolean) {
    if (forceEmpty) {
      this._releaseCandidates = {};
      return;
    }
    for (let k in this._releaseCandidates) {
      if (this._releaseCandidates[k].status == null) return;
    }
    this._releaseCandidates = {};
    this._alreadyAddedRadarrReleaseGuidList = []
    this._readyToBeProcessed = false;
  }

  get releaseCandidates() {
    return this._releaseCandidates;
  }

  get readyToBeProcessed() {
    return this._readyToBeProcessed;
  }

  public isBlackListed(id: string) {
    return this._blackList.includes(id);
  }

  public ignoreRc(id: string) {
    if (id == null || ! /\S/.test(id)) throw new NullReleaseCandidateIdError();
    let rc = this._releaseCandidates[id];
    if (rc == null) {
      throw new ReleaseCandidateNotFoundError();
    }
    rc.status = ReleaseCandidateStatus.IGNORED;
    if (!this._blackList.includes(id)) {
      this._blackList.push(id);
    }
  }

  public promoteRc(id: string) {
    if (id == null || ! /\S/.test(id)) throw new NullReleaseCandidateIdError();
    let rc = this._releaseCandidates[id];
    if (rc == null) {
      throw new ReleaseCandidateNotFoundError();
    }
    rc.status = ReleaseCandidateStatus.PROMOTED;
  }

  public addReleaseCandidate(id: string, rc: ReleaseCandidate) {
    if (id == null || ! /\S/.test(id)) throw new NullReleaseCandidateIdError();
    if (id in this._releaseCandidates) throw new ReleaseCandidateAlreadyExistsError();
    if (rc == null) throw new NullReleaseCandidateError();
    this._releaseCandidates[id] = rc;
    if (Object.entries(this._releaseCandidates).length === 1) this._lastReleaseCandidateScanTimeMillis = Date.now();
  }

  get lastRCScanTime() {
    return this._lastReleaseCandidateScanTimeMillis;
  }

  set readyToBeProcessed(flag: boolean) {
    this._readyToBeProcessed = flag;
  }

  set releaseTimeInMillis(millis: number) {
    if (millis == null) { 
      throw new NullReleaseTimeError();
    }
    this._releaseTimeInMillis = millis;
  }

  public addRadarrReleaseGuid(guid: string) {
    if (guid == null || guid.trim() == "") {
      throw new EmptyRadarrReleaseGuidError();
    }
    this._alreadyAddedRadarrReleaseGuidList.push(guid);
  }

  public radarrReleaseAlreadyAdded(guid: string) {
    if (guid == null || guid.trim() == "") {
      throw new EmptyRadarrReleaseGuidError();
    }
    return this._alreadyAddedRadarrReleaseGuidList.includes(guid);
  }
}

export class NullReleaseIdError extends Error {};

export class NullReleaseError extends Error {};

export class ReleaseWithIdAlreadyExistsError extends Error {};

export class NullTmdbIdError extends Error {};

export class InvalidOriginalLocaleError extends Error {};

export class InvalidTitleError extends Error {};

export class InvalidReleaseYearError extends Error {};

export class NullReleaseCandidateIdError extends Error {};

export class ReleaseCandidateNotFoundError extends Error {};

export class ReleaseCandidateAlreadyExistsError extends Error {};

export class NullReleaseCandidateError extends Error {};

export class EmptyRadarrReleaseGuidError extends Error {};

export class NoAudioReleaseError extends Error {};

export class NullReleaseTimeError extends Error {};

export class InvalidRuntimeError extends Error {};

export class NullAlternativeTitlesError extends Error {};
