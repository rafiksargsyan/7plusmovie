import axios, { AxiosInstance } from "axios";
import { ISonarr, ISonarrApiError, ISonarrTvShowNotFoundError, SonarrRelease } from "../core/ports/ISonarr";
import { strIsBlank } from "../utils";
import { RipType } from "../core/domain/value-object/RipType";
import { Resolution } from "../core/domain/value-object/Resolution";
import { Nullable } from "../Nullable";

const sonarrDownloadUrlBaseMapping = JSON.parse(process.env.SONARR_DOWNLOAD_URL_BASE_MAPPING!);

export class SonarrClient implements ISonarr {
  private _restClient: AxiosInstance;
  
  public constructor(apiBaseUrl: string, apiKey: string) {
    this._restClient = axios.create({
      baseURL: apiBaseUrl,
    });
    this._restClient.defaults.headers.common['x-api-key'] = apiKey;
    // don't redirect magnet urls
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && [301, 302].includes(error.response.status)) {
          return error.response;
        }
        return Promise.reject(error);
      }
    );
  }
  
  private async getIdByTvdbId(tvdbId: number) {
    let response: any = null;
    try {
      response = (await this._restClient.get(`series/lookup/?term=tvdb:${tvdbId}`)).data;
    } catch (e) {
      console.error(e);
      throw new ISonarrApiError();
    }
    if (response == null) {
      return null;
    }
    return response[0].id;
  }

  private async getIdByTmdbId(tmdbId: string) {
    let response: any = null;
    try {
      response = (await this._restClient.get(`series/lookup/?term=tmdb${tmdbId}`)).data;
    } catch (e) {
      console.error(e);
      throw new ISonarrApiError();
    }
    if (response == null) {
      return null;
    }
    return response[0].id;
  }

  async getAll(tmdbId: string, tvdbId: Nullable<number>, tmdbSeasonNumber: number): Promise<SonarrRelease[]> {
    const id = tvdbId != null ? await this.getIdByTvdbId(tvdbId) : await this.getIdByTmdbId(tmdbId);
    if (id == null) {
      throw new ISonarrTvShowNotFoundError();
    }
    let response;
    try {
      response = (await this._restClient.get(`release/?seriesId=${id}&seasonNumber=${tmdbSeasonNumber}`)).data;
      if (response == null) response = [];
    } catch (e) {
      console.log(e);
      throw new ISonarrApiError();
    }
    const ret: SonarrRelease[] = [];
    for (const r of response) {
      const guid = r.guid;
      if (strIsBlank(guid)) {
        console.warn(`Blank guid for release=${JSON.stringify(r)}`);
        continue;
      }
      // Ideally we should use something for Sonarr, but for now using the approach is OK, as
      // Radarr and Sonarr doing quality in the same way
      const ripType = RipType.fromRadarrReleaseQualityName(r?.quality?.quality?.name);
      if (ripType == null) {
        console.warn(`Unknown quality for release=${JSON.stringify(r)}`);
        continue;
      }
      const infoUrl = r.infoUrl;
      const commentUrl = r.commentUrl;
      const protocol = r.protocol;
      if (strIsBlank(protocol)) {
        console.warn(`Blank protocol for release=${JSON.stringify(r)}`);
        continue;
      }
      const seeders = r.seeders;
      const customFormatScore = r.customFormatScore;
      let resolution = Resolution.fromPixels(r?.quality?.quality?.resolution, r?.quality?.quality?.resolution);
      if (resolution == null) {
        if (ripType.isLowQuality()) {
          resolution = Resolution.SD;
        } else {
          console.warn(`Failed to resolve resolution for release=${r}`);
          continue
        }
      }
      const age = r.age
      const ageInMinutes = r.ageMinutes
      const title = r.title
      if (strIsBlank(title)) {
        console.warn(`Blank title for release=${r}`)
      }
      const downloadUrl = this.normalizeDownloadUrl(r.downloadUrl)
      if (downloadUrl == null) {
        console.warn(`Invalid download url for release=${r}`)
        continue
      }
      let sonarrLanguages = r.languages != null ? r.languages : [];
      const languages: string[] = [];
      sonarrLanguages.forEach(sl => {
        if (!strIsBlank(sl.name)) {
          languages.push(sl.name.toLowerCase());  
        }
      });
      const indexer = r.indexer;
      if (strIsBlank(indexer)) {
        console.warn(`Unknown indexer name for release=${r}`);
      }
      ret.push({
        guid: guid,
        ripType: ripType,
        infoUrl: infoUrl,
        commentUrl: commentUrl,
        protocol: protocol,
        seeders: seeders,
        customFormatScore: customFormatScore,
        resolution: resolution,
        age: age,
        ageInMinutes: ageInMinutes,
        title: title,
        downloadUrl: downloadUrl,
        languages: languages,
        indexer: indexer,
        infoHash: r.infoHash
      })
    }
    
    return ret;
  }

  private normalizeDownloadUrl(url: Nullable<string>) {
    if (url == null) return null;
    if (url.startsWith("magnet")) {
      if (url.length > 2000) {
        console.warn(`Too long downloadUrl=${url}`);
        return null;
      } else {
        return url;
      }
    }
    for (let k in sonarrDownloadUrlBaseMapping) {
      if (url.startsWith(k)) {
        const publicBase = sonarrDownloadUrlBaseMapping[k];
        const ret = publicBase + url.substring(k.length);
        if (ret.length > 2000) {
          console.warn(`Too long downloadUrl=${url}`);
          return null;  
        }
        return ret;
      }
    }
    throw new Error(`Failed to resolve public download url for url=${url}`);
  }
}

