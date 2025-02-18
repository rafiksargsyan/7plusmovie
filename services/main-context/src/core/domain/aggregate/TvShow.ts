import { v4 as uuid } from 'uuid';
import { L8nLangCode } from '../L8nLangCodes';
import { TvShowGenre } from '../TvShowGenres';
import { Release, ReleaseRead } from '../entity/Release';
import { Nullable, strIsBlank } from '../../../utils';

interface Episode {
  originalName: string
  nameL8ns: { [key: string]: string }
  stillImage?: string
  releases: { [key: string]: Release }
  tmdbEpisodeNumber?: number
  episodeNumber: number
  monitorReleases: boolean
  inTranscoding: boolean
  airDateInMillis: Nullable<number>;
}

interface Season {
  posterImagesPortrait: { [key: string]: string };
  posterImagesLandscape: { [key: string]: string };
  originalName: string;
  nameL8ns: { [key: string]: string };
  tmdbSeasonNumber?: number;
  episodes: Episode[];
  seasonNumber: number;
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
  private _ricTvShowId: Nullable<string>;
  private _tmdbSyncEnabled: boolean = false;

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
    if (releaseYear == undefined || !Number.isInteger(releaseYear) || releaseYear < 1895 || releaseYear > new Date().getFullYear()) {
        throw new InvalidReleaseYearError();
    }
    return releaseYear;
  }

  public addPosterImagePortrait(locale: L8nLangCode | undefined, relativePath: string | undefined) {
    if (locale == undefined) {
      throw new InvalidLocaleError();
    }
    if (relativePath == undefined || ! /\S/.test(relativePath)) {
      throw new InvalidPosterImageRelativePathError();
    }
    this.posterImagesPortrait[locale.code] = relativePath;
    this.touch();
  }

  public addBackdropImage(relativePath: string | undefined) {
    if (relativePath == undefined || ! /\S/.test(relativePath)) {
      throw new InvalidBackdropImageRelativePathError();
    }
    this.backdropImage = relativePath;
    this.touch();
  }

  public addStillImage(seasonNumber: number | undefined, episodeNumber: number | undefined, relativePath: string | undefined) {
    if (relativePath == undefined || ! /\S/.test(relativePath)) {
      throw new InvalidStillImageRelativePathError();
    }
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    episode.stillImage = relativePath;
    this.touch();
  }

  public addTitleL8n(locale: L8nLangCode | undefined, title: string | undefined) {
    if (title == undefined || ! /\S/.test(title)) {
      throw new InvalidTitleL8nError();
    }
    if (locale == undefined) {
      throw new InvalidLocaleError();
    }
    // TODO: validate that title is in provided locale
    this.titleL8ns[locale.code] = title;
    this.touch();
  }

  public addGenre(genre: TvShowGenre | undefined): boolean {
    if (genre == undefined) {
      throw new InvalidGenreError();
    }
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

  public setTheMovieDbId(tmdbId: string | undefined) {
    if (tmdbId == undefined || ! /\S/.test(tmdbId)) {
      throw new InvalidTmdbIdError();
    }
    this.tmdbId = tmdbId;
    this.touch();
  }

  public addSeason(originalName?: string, seasonNumber?: number) {
    if (originalName == undefined || ! /\S/.test(originalName)) {
      throw new InvalidSeasonNameError();
    }
    if (seasonNumber == undefined || seasonNumber < 0) {
      throw new InvalidSeasonNumberError();  
    }
    this.seasons.forEach(_ => {
      if (_.originalName == originalName) {
        throw new SeasonWithNameAlreadyExistsError();
      }
      if (_.seasonNumber == seasonNumber) {
        throw new SeasonWithSeasonNumberAlreadyExistsError();
      }
    })
    this.seasons.push({
      originalName: originalName,
      posterImagesPortrait: {},
      posterImagesLandscape: {},
      nameL8ns: {},
      episodes: [],
      seasonNumber: seasonNumber
    });
    this.touch();
  }

  public addPosterImagePortraitToSeason(seasonNumber?: number, locale?: L8nLangCode, relativePath?: string) {
    if (locale == undefined) {
      throw new InvalidLocaleError();
    }
    if (relativePath == undefined || ! /\S/.test(relativePath)) {
      throw new InvalidPosterImageRelativePathError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    season.posterImagesPortrait[locale.code] = relativePath;
    this.touch();
  }

  public addTmdbSeasonNumberToSeason(seasonNumber: number | undefined, tmdbSeasonNumber: number | undefined) {
    if (tmdbSeasonNumber == undefined) {
      throw new InvalidTmdbSeasonNumberError();
    }
    this.seasons.forEach((_, i) => {
      if (_.seasonNumber != seasonNumber && _.tmdbSeasonNumber == tmdbSeasonNumber) {
        throw new DuplicateTmdbSeasonNumberError();
      }
    })
    const season = this.getSeasonOrThrow(seasonNumber);
    if (season.tmdbSeasonNumber != null) return false;
    season.tmdbSeasonNumber = tmdbSeasonNumber;
    this.touch();
    return true;
  }

  public addSeasonNameL8n(seasonNumber: number | undefined, locale: L8nLangCode | undefined, name: string | undefined) {
    if (locale == undefined) {
      throw new InvalidLocaleError();
    }
    if (name == undefined || ! /\S/.test(name)) {
      throw new InvalidSeasonNameL8nError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    season.nameL8ns[locale.code] = name;
    this.touch();
  }

  public addEpisodeToSeason(seasonNumber: number | undefined, originalName: string | undefined, episodeNumber: number | undefined) {
    if (originalName == undefined || ! /\S/.test(originalName)) {
      throw new InvalidEpisodeNameError();
    }
    if (episodeNumber == undefined || episodeNumber < 0) {
      throw new InvalidEpisodeNumberError();
    }
    const season = this.getSeasonOrThrow(seasonNumber)
    season.episodes.forEach(_ => {
      if (_.originalName == originalName) {
        throw new EpisodeWithNameAlreadyExistsError()
      }
      if (_.episodeNumber == episodeNumber) {
        throw new EpisodeWithEpisodeNumberAlreadyExistsError()
      }
    })
    season.episodes.push({
      originalName: originalName,
      releases: {},
      nameL8ns: {},
      episodeNumber: episodeNumber,
      inTranscoding: false,
      monitorReleases: false,
      airDateInMillis: null
    })
    this.touch()
  }

  public addTmdbEpisodeNumber(seasonNumber: number | undefined, episodeNumber: number | undefined,
                              tmdbEpisodeNumber: number | undefined) {
    if (tmdbEpisodeNumber == undefined) {
      throw new InvalidTmdbEpisodeNumberError();
    }
    const season = this.getSeasonOrThrow(seasonNumber);
    season.episodes.forEach((_, i) => {
      if (_.episodeNumber != episodeNumber && _.tmdbEpisodeNumber == tmdbEpisodeNumber) {
        throw new DuplicateTmdbEpisodeNumberError();
      }
    })
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (episode.tmdbEpisodeNumber != null) return false;
    episode.tmdbEpisodeNumber = tmdbEpisodeNumber;
    this.touch();
    return true;
  }

  public addEpisodeNameL8n(seasonNumber: number | undefined, episodeNumber: number | undefined,
                           locale: L8nLangCode | undefined, name: string | undefined) {
    if (locale == undefined) {
      throw new InvalidLocaleError();
    }
    if (name == undefined || ! /\S/.test(name)) {
      throw new InvalidEpisodeNameL8nError();
    }
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    episode.nameL8ns[locale.code] = name;
  }

  getSeasonOrThrow(seasonNumber?: number) {
    const season = this.seasons.filter(_ => _.seasonNumber == seasonNumber)[0];
    if (season == undefined) {
      throw new InvalidSeasonError();
    }
    return season;
  }

  getEpisodeOrThrow(seasonNumber?: number, episodeNumber?: number) {
    const season = this.getSeasonOrThrow(seasonNumber);
    const episode = season.episodes.filter(_ => _.episodeNumber == episodeNumber)[0];
    if (episode == undefined) {
      throw new InvalidEpisodeError();
    }
    return episode;
  }

  public addRelease(s?: number, e?: number, key?: string, r?: Release) {
    if (strIsBlank(key)) {
      throw new NullReleaseKeyError();
    }
    if (r == null) {
      throw new NullReleaseError();
    }
    const episode = this.getEpisodeOrThrow(s, e);
    const trimmedKey = key!.trim();
    if (trimmedKey in episode.releases) {
      throw new ReleaseWithKeyAlreadyExistsError();
    }
    episode.releases[trimmedKey] = r;
    this.touch();
  }

  public removeRelease(s?: number, e?: number, key?: string) {
    const episode = this.getEpisodeOrThrow(s, e);
    if (strIsBlank(key)) {
      throw new NullReleaseKeyError();
    }
    delete episode.releases[key!.trim()];
    this.touch();
  }

  public getRelease(s?: number, e?: number, key?: string) {
    if (strIsBlank(key)) return null;
    const episode = this.getEpisodeOrThrow(s, e);
    return episode.releases[key!];
  }

  public releaseAlreadyExists(seasonNumber: number, episodeNumber: number, ricReleasId: string) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber)
    for (const k in episode.releases) {
      const r = episode.releases[k] as unknown as ReleaseRead;
      if (ricReleasId === r._releaseIndexerContextId) {
        return true;
      }
    }
    return false;
  }
  
  addRICTvShowId(id: string) {
    if (strIsBlank(id)) {
      throw new BlankRICTvShowIdError();
    }
    this._ricTvShowId = id;
  }

  get ricTvShowId() {
    return this._ricTvShowId
  }

  transcodingStarted(seasonNumber: number, episodeNumber: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber)
    episode.inTranscoding = true
  }

  transcodingFinished(seasonNumber: number, episodeNumber: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber)
    episode.inTranscoding = false
  }

  inTranscoding(seasonNumber: number, episodeNumber: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber)
    return episode.inTranscoding
  }

  setMonitorReleases(seasonNumber: Nullable<number>, episodeNumber: Nullable<number>, monitorReleases: boolean) {
    if (episodeNumber != null && episodeNumber != 0 &&  !isNaN(episodeNumber) &&
        seasonNumber != null && seasonNumber != 0 && !isNaN(seasonNumber)) {
      const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber)
      episode.monitorReleases = monitorReleases
    } else if (seasonNumber != null && seasonNumber != 0 && !isNaN(seasonNumber)) {
      const season = this.getSeasonOrThrow(seasonNumber)
      for (const e of season.episodes) {
        e.monitorReleases = monitorReleases
      }
    } else {
      for (const s of this.seasons) {
        for (const e of s.episodes) {
          e.monitorReleases = monitorReleases
        }
      }
    }
  }

  setEpisodeAirDateInMillis(seasonNumber: number, episodeNumber: number, airDateInMillis: number) {
    const episode = this.getEpisodeOrThrow(seasonNumber, episodeNumber);
    if (airDateInMillis == null || airDateInMillis <= 0) {
      throw new InvalidEpisodeAirDateError();
    }
    if (episode.airDateInMillis === airDateInMillis) return false;
    episode.airDateInMillis = airDateInMillis;
    this.touch();
    return true;
  }

  getTmdbId() {
    return this.tmdbId
  }

  seasonExists(seasonNumber: number) {
    return this.getSeason(seasonNumber) != null;
  }

  private getSeason(seasonNumber: number) {
    for (const s of this.seasons) {
      if (s.seasonNumber === seasonNumber) {
        return s;
      }
    }
    return null;
  }

  episodeExists(seasonNumber: number, episodeNumber: number) {
    return this.getEpisode(seasonNumber, episodeNumber) != null;
  }

  private getEpisode(seasonNumber: number, episodeNumber: number) {
    const season = this.getSeason(seasonNumber);
    if (season == null) return null;
    for (const e of season.episodes) {
      if (e.episodeNumber === episodeNumber) {
        return e;
      }
    }
    return null;
  }

  get tmdbSyncEnabled() {
    return this._tmdbSyncEnabled;
  }

  set tmdbSyncEnabled(v: boolean) {
    if (this._tmdbSyncEnabled != v) this.touch();
    this._tmdbSyncEnabled = v;
  }
}

class InvalidTitleError extends Error {}

class InvalidReleaseYearError extends Error {}

class InvalidPosterImageRelativePathError extends Error {}

class InvalidOriginalLocaleError extends Error {}

class InvalidTitleL8nError extends Error {}

class InvalidBackdropImageRelativePathError extends Error {}

class InvalidTmdbIdError extends Error {}

class InvalidSeasonNameError extends Error {}

class InvalidSeasonError extends Error {}

class InvalidLocaleError extends Error {}

class InvalidTmdbSeasonNumberError extends Error {}

class InvalidSeasonNameL8nError extends Error {}

class SeasonWithNameAlreadyExistsError extends Error {}

class InvalidEpisodeNameError extends Error {}

class EpisodeWithNameAlreadyExistsError extends Error {}

class InvalidEpisodeError extends Error {}

class DuplicateTmdbSeasonNumberError extends Error {}

class InvalidTmdbEpisodeNumberError extends Error {}

class DuplicateTmdbEpisodeNumberError extends Error {}

class InvalidStillImageRelativePathError extends Error {}

class InvalidGenreError extends Error {}

class InvalidEpisodeNameL8nError extends Error {}

class InvalidSeasonNumberError extends Error {}

class InvalidEpisodeNumberError extends Error {}

class SeasonWithSeasonNumberAlreadyExistsError extends Error {}

class EpisodeWithEpisodeNumberAlreadyExistsError extends Error {}

class NullReleaseKeyError extends Error {}

class NullReleaseError extends Error {}

class ReleaseWithKeyAlreadyExistsError extends Error {}

class BlankRICTvShowIdError extends Error {}

class InvalidEpisodeAirDateError {}