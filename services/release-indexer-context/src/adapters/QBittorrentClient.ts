import axios, { AxiosInstance } from "axios";
import { TorrentApiError, TorrentClientInterface, TorrentInfo, TorrentNotFoundError } from "../core/ports/TorrentClientInterface";
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
      const info = (await this._restClient.get(`torrents/info?hashes=${hash}`)).data;
      if (info.length === 0) return null;
      const isStalled = info[0].state === "stalledDL" ? true : false;
      const addedOn = info[0].added_on;
      const amountLeft = info[0].amount_left;
      const files = (await this._restClient.get(`torrents/files?hash=${hash}`)).data;
      const tagsStr: string = info[0].tags;
      const tags: string[] = tagsStr.split(',').map((s) => s.trim());
      return {
        hash : hash,
        addedOn : addedOn,
        isStalled : isStalled,
        amountLeft : amountLeft,
        files: files.map((f) => ({ name: f.name, size: f.size, progress: f.progress, index: f.index })),
        tags: tags,
        eta: info[0].eta
      }
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }
 
  public async getTorrentByHashOrThrow(hash: string): Promise<TorrentInfo> {
    let ti = await this.getTorrentByHash(hash);
    if (ti == null) {
      throw new TorrentNotFoundError();
    }
    return ti;
  }

  public async getAllTorrents(): Promise<TorrentInfo[]> {
    await this.checkAndInit();
    try {
      const info = (await this._restClient.get('torrents/info')).data;
      let ret: TorrentInfo[] = [];
      for (let t of info) {
        const isStalled = t.state === "stalledDL" ? true : false;
        const addedOn = t.added_on;
        const amountLeft = t.amount_left;
        const files = (await this._restClient.get(`torrents/files?hash=${t.hash}`)).data;
        const tagsStr: string = t.tags;
        const tags: string[] = tagsStr.split(',').map((s) => s.trim());
        ret.push({
          hash : t.hash,
          addedOn : addedOn,
          isStalled : isStalled,
          amountLeft : amountLeft,
          files: files.map((f) => ({ name: f.name, size: f.size, progress: f.progress, index: f.index })),
          tags: tags,
          eta: t.eta
        });
      }
      return ret;
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async getTorrentsByTag(tag: string): Promise<TorrentInfo[]> {
    if (tag == null || tag.trim().length === 0) {
      throw new InvalidTagError();
    }
    await this.checkAndInit();
    try {
      const info = (await this._restClient.get(`torrents/info?tag=${encodeURIComponent(tag)}`)).data;
      let ret: TorrentInfo[] = [];
      for (let t of info) {
        const isStalled = t.state === "stalledDL" ? true : false;
        const addedOn = t.added_on;
        const amountLeft = t.amount_left;
        const files = (await this._restClient.get(`torrents/files?hash=${t.hash}`)).data;
        const tagsStr: string = t.tags;
        const tags: string[] = tagsStr.split(',').map((s) => s.trim());
        ret.push({
          hash : t.hash,
          addedOn : addedOn,
          isStalled : isStalled,
          amountLeft : amountLeft,
          files: files.map((f) => ({ name: f.name, size: f.size, progress: f.progress, index: f.index })),
          tags: tags,
          eta: t.eta
        });
      }
      return ret;
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }
  
  public async getEstimatedFreeSpace(): Promise<number> {
    await this.checkAndInit();
    try {
      const maindata = (await this._restClient.get('sync/maindata')).data;
      let totalAmountLeft = 0;
      for (let k of Object.keys(maindata.torrents)) {
        totalAmountLeft += maindata.torrents[k].amount_left;
      }
      const freeSpaceOnDisk = maindata.server_state.free_space_on_disk;
      return freeSpaceOnDisk - totalAmountLeft;
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
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

  public async addTagToTorrent(hash: string, tag: string) {
    if (tag == null || tag.trim().length === 0) {
      throw new InvalidTagError();
    }
    tag = tag.trim();
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/addTags', {
        hashes: hash,
        tags: tag
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async removeTagFromTorrent(hash: string, tag: string) {
    if (tag == null || tag.trim().length === 0) {
      throw new InvalidTagError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/removeTags', {
        hashes: hash,
        tags: tag
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async resumeTorrent(hash: string) {
    if (hash == null || hash.trim().length === 0) {
      throw new InvalidHashError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/resume', {
        hashes: hash
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async pauseTorrent(hash: string) {
    if (hash == null || hash.trim().length === 0) {
      throw new InvalidHashError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/pause', {
        hashes: hash
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async disableAllFiles(hash: string) {
    if (hash == null || hash.trim().length === 0) {
      throw new InvalidHashError();
    }
    await this.checkAndInit();
    try {
      const files = (await this._restClient.get(`torrents/files?hash=${hash}`)).data;
      await this._restClient.post(`torrents/filePrio`, {
        hash: hash,
        id: files.map((f) => f.index).join('|'),
        priority: 0
      })
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async enableFile(hash: string, index: number) {
    if (hash == null || hash.trim().length === 0) {
      throw new InvalidHashError();
    }
    if (index == null || index < 0 || !Number.isInteger(index)) {
      throw new InvalidFileIndexError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post(`torrents/filePrio`, {
        hash: hash,
        id: index,
        priority: 1
      })
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }   
  }
}

export class InvalidTorrentUrlError extends Error {}

export class InvalidHashError extends Error {}

export class InvalidTagError extends Error {}

export class InvalidFileIndexError extends Error {}
