import axiosRetry from 'axios-retry'
import { Episode, ITvdbClient, Season, TvShow, TvShowTranslation } from '../core/ports/ITvdbClient'
import axios, { AxiosInstance } from "axios"
import jwt from 'jsonwebtoken';
import { Nullable, strIsBlank } from '../utils';

export class TvdbClient implements ITvdbClient {
  private _restClient: AxiosInstance;
  private _apiKey: string;
  private _apiBaseUrl: string;
  private _authToken: Nullable<string>;
  private _authTokenExpSeconds: number = 0;

  constructor(apiBaseUrl: string, apiKey: string) {
    this._apiKey = apiKey
    this._apiBaseUrl = apiBaseUrl
    this._restClient = axios.create({
      baseURL: this._apiBaseUrl,
    })
    axiosRetry(this._restClient, { retryDelay: axiosRetry.exponentialDelay, retries: 3 })
  }

  async getTvShowSeasons(id: number): Promise<Season[]> {
    await this.refreshAuthHeader();
    const ret: Season[] = [];
    const response = (await this._restClient.get(`series/${id}/episodes/default`)).data;
    for (const e of response.data.episodes) {
      const episodeDetailsResponse = (await this._restClient.get(`episodes/${e.id}`)).data.data;
      const tvdbSeasons = episodeDetailsResponse.seasons;
      if (tvdbSeasons == null) continue;
      const officialSeason = (tvdbSeasons.filter(s => s.type.type === 'official'))[0];
      if (officialSeason == null) continue;
      let season = ret.filter(s => s.id === officialSeason.id)[0];
      if (season == null) {
        const seasonDetails = (await this._restClient.get(`seasons/${officialSeason.id}`)).data.data;
        season = {
          id: officialSeason.id,
          number: e.seasonNumber,
          name: strIsBlank(seasonDetails.name) ? `Season ${e.seasonNumber}` : seasonDetails.name,
          image: seasonDetails.image,
          episodes: []
        }
        ret.push(season);
      }
      season.episodes.push({
        id: e.id,
        aired: e.aired,
        runtimeMinutes: e.runtime,
        number: e.number,
        name: episodeDetailsResponse.name,
        image: e.image,
        nameTranslations: e.nameTranslations
      });
    }
    return ret;
  }
  
  async getTvShowById(id: number): Promise<TvShow> {
    await this.refreshAuthHeader();
    const response = (await this._restClient.get(`series/${id}`)).data;
    return {
      id: id,
      name: response.data.name,
      nameTranslations: response.data.nameTranslations || []
    }
  }
  
  // Will throw exception if a translation for lang is not available
  async getTvShowTranslation(id: number, lang: string): Promise<TvShowTranslation> {
    await this.refreshAuthHeader();
    const response = (await this._restClient.get(`series/${id}/translations/${lang}`)).data;
    return {
      name: response.data.name
    }
  }

  async getEpisodeNameTranslation(id: number, lang: string): Promise<Nullable<string>> {
    await this.refreshAuthHeader();
    const response = (await this._restClient.get(`episodes/${id}/translations/${lang}`)).data;
    return response.data.name;
  }

  private async login() {
    let loginResponse = (await this._restClient.post('/login', {
      apiKey: this._apiKey
    })).data;
    this._authToken = loginResponse.data.token;
    this._authTokenExpSeconds = jwt.decode(this._authToken).exp;
  }

  private tokenExpired() {
    return this._authTokenExpSeconds * 1000 - Date.now() < 60 * 60 * 1000;
  }

  private async checkAndLogin() {
    if (this.tokenExpired()) {
      await this.login();
      return true;
    }
    return false;
  }

  private async refreshAuthHeader() {
    if (await this.checkAndLogin()) {
      this._restClient.defaults.headers.common['Authorization'] = `Bearer ${this._authToken}`;  
    }
  }
}
