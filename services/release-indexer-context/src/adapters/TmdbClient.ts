import axiosRetry from 'axios-retry'
import axios, { AxiosInstance } from "axios"
import { ITmdbClient, TvShowExternalIds } from '../core/ports/ITmdbClient';

export class TmdbClient implements ITmdbClient {
  private _restClient: AxiosInstance;
  private _apiKey: string;
  private _apiBaseUrl: string;

  constructor(apiBaseUrl: string, apiKey: string) {
    this._apiKey = apiKey
    this._apiBaseUrl = apiBaseUrl
    this._restClient = axios.create({
      baseURL: this._apiBaseUrl,
    })
    this._restClient.interceptors.request.use((config) => {
      config.params = config.params || {};
      config.params['api_key'] = this._apiKey;
      return config;
    });
    axiosRetry(this._restClient, { retryDelay: axiosRetry.exponentialDelay, retries: 3 })
  }

  async getTvShowExternalIds(id: number): Promise<TvShowExternalIds> {
    const response = (await this._restClient.get(`tv/${id}/external_ids`)).data;
    return {
      imdbId: response.imdb_id,
      tvdbId: response.tvdb_id
    }
  }

  async getIdByTvdbId(id: number): Promise<number> {
    const response = (await this._restClient.get(`find/${id}?external_source=tvdb_id`)).data;
    return response.tv_results[0]?.id
  }  
}
