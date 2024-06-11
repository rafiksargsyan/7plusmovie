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

  public async deleteTorrentById(id: string) {
    if (id == null || id.trim().length === 0) {
      throw new InvalidIdError();
    }
    await this.checkAndInit();
    try {
      const ti = await this.getTorrentById(id);
      if (ti != null) {
        await this._restClient.post('torrents/delete', {
          hashes: ti.infoHash,
          deleteFiles: true
        });
      }
      try {
        await this._restClient.post(`torrents/deleteTags?tags=${id}`);
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async getTorrentById(id: string): Promise<Nullable<TorrentInfo>> {
    if (id == null || id.trim().length === 0) {
      throw new InvalidIdError();
    }
    return (await this.getTorrentsByTag(id))[0];
  }
 
  public async getTorrentByIdOrThrow(id: string): Promise<TorrentInfo> {
    let ti = await this.getTorrentById(id);
    if (ti == null) {
      throw new TorrentNotFoundError();
    }
    return ti;
  }

  private async getTorrentsByTag(tag: string): Promise<TorrentInfo[]> {
    await this.checkAndInit();
    try {
      const info = (await this._restClient.get(`torrents/info?tag=${encodeURIComponent(tag)}`)).data;
      let ret: TorrentInfo[] = [];
      for (let t of info) {
        const isStalled = t.state === "stalledDL" ? true : false;
        const addedOn = t.added_on;
        const amountLeft = t.amount_left;
        const files = (await this._restClient.get(`torrents/files?hash=${t.hash}`)).data;
        ret.push({
          id : tag,
          infoHash : t.hash,
          addedOn : addedOn,
          isStalled : isStalled,
          amountLeft : amountLeft,
          files: files.map((f) => ({ name: f.name, size: f.size, progress: f.progress, index: f.index })),
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

  public async addTorrentByUrlOrThrow(url: string, fileOrMagnetHash: string) {
    if (url == null || url.trim().length === 0) {
      throw new InvalidTorrentUrlError();
    }
    if (fileOrMagnetHash == null || fileOrMagnetHash.trim().length === 0) {
      throw new InvalidFileOrMagnetHashError();
    }
    await this.checkAndInit();
    try {
      await this._restClient.post('torrents/add', {
        urls: url,
        paused: true,
        tags: fileOrMagnetHash
      });
      let torrentInfo;
      let tryCount = 3;
      while (torrentInfo == null && tryCount-- > 0) {
        await new Promise(r => setTimeout(r, 5000));
        torrentInfo = await this.getTorrentById(fileOrMagnetHash);
      }
      if (torrentInfo == null) {
        throw new TimedOutWaitingTorrentToBeAddedError();
      }
      return torrentInfo;
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async resumeTorrent(id: string) {
    if (id == null || id.trim().length === 0) {
      throw new InvalidIdError();
    }
    await this.checkAndInit();
    try {
      const ti = await this.getTorrentByIdOrThrow(id);
      await this._restClient.post('torrents/resume', {
        hashes: ti.infoHash
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async pauseTorrent(id: string) {
    if (id == null || id.trim().length === 0) {
      throw new InvalidIdError();
    }
    await this.checkAndInit();
    try {
      const ti = await this.getTorrentByIdOrThrow(id);
      await this._restClient.post('torrents/pause', {
        hashes: ti.infoHash
      });
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async disableAllFiles(id: string) {
    if (id == null || id.trim().length === 0) {
      throw new InvalidIdError();
    }
    await this.checkAndInit();
    try {
      const ti = await this.getTorrentByIdOrThrow(id);
      const files = (await this._restClient.get(`torrents/files?hash=${ti.infoHash}`)).data;
      await this._restClient.post(`torrents/filePrio`, {
        hash: ti.infoHash,
        id: files.map((f) => f.index).join('|'),
        priority: 0
      })
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }
  }

  public async enableFile(id: string, index: number) {
    if (id == null || id.trim().length === 0) {
      throw new InvalidIdError();
    }
    if (index == null || index < 0 || !Number.isInteger(index)) {
      throw new InvalidFileIndexError();
    }
    await this.checkAndInit();
    try {
      const ti = await this.getTorrentByIdOrThrow(id);
      await this._restClient.post(`torrents/filePrio`, {
        hash: ti.infoHash,
        id: index,
        priority: 1
      })
    } catch (e) {
      throw new TorrentApiError((e as Error).message);
    }   
  }
}

export class InvalidTorrentUrlError extends Error {}

export class InvalidIdError extends Error {}

export class InvalidTagError extends Error {}

export class InvalidFileIndexError extends Error {}

export class InvalidFileOrMagnetHashError extends Error {}

export class TimedOutWaitingTorrentToBeAddedError extends Error {}
