import axios, { AxiosInstance } from "axios";
import { TorrentClientInterface } from "../core/ports/TorrentClientInterface";

export class QBittorrentClient implements TorrentClientInterface {
  private _restClient: AxiosInstance;
  private _username: string;
  private _password: string;
  private _apiBaseUrl: string;
  private _sessionCookie: string;

  public constructor(apiBaseUrl: string, username: string, password: string) {
    this._username = username;
    this._password = password;
    this._apiBaseUrl = apiBaseUrl;
    this._restClient = axios.create({
      baseURL: this._apiBaseUrl,
    });
    this._restClient.defaults.headers.common['Referer'] = `${this._apiBaseUrl}`;
    this._restClient.defaults.headers.common['Content-Type'] = 'application/json';
  }

  private async init() {
    const loginResponse = (await this._restClient.post('auth/login', `username=${this._username}&password=${this._password}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })).headers;
    const setCookie = loginResponse['set-cookie'];
    let sessionCookie;
    if (setCookie != null) sessionCookie = setCookie[0];
    this._sessionCookie = sessionCookie.substring(0, sessionCookie.indexOf(';'));
    this._restClient.defaults.headers.common['Cookie'] = this._sessionCookie;
  }

  private async checkClient() {
    try {
      await this._restClient.get('app/version');
    } catch (e) {
      return false;
    }
    return true;
  }

  private async checkAndInit() {
    if (! await this.checkClient()) {
      await this.init();
    }
  }

  public async version() {
    await this.checkAndInit();
    return (await this._restClient.get('app/version')).data;
  }

  public async destroy() {
    if (await this.checkClient()) {
      await this._restClient.post('auth/logout');
    }
  }
}