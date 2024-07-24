import axios, { AxiosInstance } from "axios";
import { ISonarr, ISonarrApiError, ISonarrTvShowNotFoundError, SonarrRelease } from "../core/ports/ISonarr";
import { strIsBlank } from "../utils";
import { RipType } from "../core/domain/value-object/RipType";

export class SonarrClient implements ISonarr {
  private _restClient: AxiosInstance;
  
  public constructor(apiBaseUrl: string, apiKey: string) {
    this._restClient = axios.create({
      baseURL: apiBaseUrl,
    });
    this._restClient.defaults.headers.common['x-api-key'] = apiKey;
    // don't redirect magnet urls
    this._restClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response && [301, 302].includes(error.response.status)) {
          return error.response;
        }
        return Promise.reject(error);
      }
    );
  }
  
  private async getIdByTmdbId(tmdbId: string) {
    let response: any = null;
    try {
      response = (await this._restClient.get(`series/lookup/?term=${tmdbId}`)).data;
    } catch (e) {
      console.error(e);
      throw new ISonarrApiError();
    }
    if (response == null || response.length !== 1) {
      return null;
    }
    return response[0].id;
  }

  async getAll(tmdbId: string, tmdbSeasonNumber: number): Promise<SonarrRelease[]> {
    const id = await this.getIdByTmdbId(tmdbId);
    if (id == null) {
      throw new ISonarrTvShowNotFoundError();
    }
    let response;
    try {
      response = (await this._restClient.get(`release/?seriesId=${id}?seasonNumber=${tmdbSeasonNumber}`)).data;
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
      // Ideally we should use something for Sonarr, but for now using he approach is OK, as
      // Radarr and Sonarr doing quality in the same way
      const ripType = RipType.fromRadarrReleaseQualityName(r?.quality?.quality?.name);
      if (ripType == null) {
        console.warn(`Unknown quality for release=${JSON.stringify(r)}`);
        continue;
      }
      ret.push({
        guid: guid,
        ripType: ripType
        // todo rest
      })
    }
    
    return ret;
  }
}

