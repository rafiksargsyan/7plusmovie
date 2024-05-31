import axios, { AxiosInstance } from "axios";
import { TorrentApiError, TorrentClientInterface, TorrentInfo } from "../core/ports/TorrentClientInterface";
import { Nullable } from "../Nullable";

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
    this._restClient.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';
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

  public isTaggingSupported() {
    return true;
  }

  public async deleteTorrentByHash(hash: string) {
    if (hash == null || hash.trim().length === 0) {
      throw new InvalidHashError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/delete', {
        hashes: hash,
        deleteFiles: true
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async getTorrentByHash(hash: string): Promise<Nullable<TorrentInfo>> {
    if (hash == null || hash.trim().length === 0) {
      throw new InvalidHashError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/delete', {
        hashes: hash,
        deleteFiles: true
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
    return null;
  }
 
  getTorrentByHashOrThrow(hash: string) {
    throw new Error("Method not implemented.");
  }

  public async getAllTorrents(): Promise<TorrentInfo[]> {
    await this.checkAndInit();
    try {
      console.log((await this._restClient.get('torrents/info')).data);
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
    return [];
  }

  getTorrentsByTag(tag: string): TorrentInfo[] {
    throw new Error("Method not implemented.");
  }
  
  getEstimatedFreeSpace(): number {
    throw new Error("Method not implemented.");
  }

  public async addTorrentByUrl(url: string) {
    if (url == null || url.trim().length === 0) {
      throw new InvalidHashError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/add', {
        urls: url,
        paused: true,
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }
}

export class InvalidTorrentUrlError extends Error {}

export class InvalidHashError extends Error {}
