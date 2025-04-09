import axiosRetry from 'axios-retry'
import { ITvdbClient } from '../core/ports/ITvdbClient'
import axios, { AxiosInstance } from "axios"
import { Nullable } from '../Nullable'
import jwt from 'jsonwebtoken';

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

  private async login() {
    let loginResponse = await this._restClient.post('/login', {
      apiKey: this._apiKey
    });
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