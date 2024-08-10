import axios, { AxiosInstance } from "axios"
import { strIsBlank } from "../utils"
import { Nullable } from "../Nullable"
import { ITorrentClient, TorrentError, TorrentInfo, TorrentRuntimeError } from "../core/ports/ITorrentClient"
import { v4 as uuidv4 } from 'uuid'
import axiosRetry from 'axios-retry'

export class QBittorrentClientV2 implements ITorrentClient {
  private _restClient: AxiosInstance
  private _username: string
  private _password: string
  private _apiBaseUrl: string
  private _sessionCookie: Nullable<string>

  public constructor(apiBaseUrl: string, username: string, password: string) {
    this._username = username
    this._password = password
    this._apiBaseUrl = apiBaseUrl
    this._restClient = axios.create({
      baseURL: this._apiBaseUrl,
    })
    axiosRetry(this._restClient, { retryDelay: axiosRetry.exponentialDelay, retries: 3 })
    this._restClient.defaults.headers.common['Referer'] = `${this._apiBaseUrl}`
    this._restClient.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  private async init() {
    let loginResponse
    try {
      loginResponse = (await this._restClient.post('auth/login', `username=${this._username}&password=${this._password}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })).headers
      // looks like there was a regression in axios; 'set-cookie' is not always string[]
      const setCookie: string | string[] | undefined = loginResponse['set-cookie']
      let sessionCookie: Nullable<string>
      if (setCookie != null) sessionCookie = (typeof setCookie === 'string' ? setCookie as any as string : setCookie[0]);
      if (strIsBlank(sessionCookie)) {
        throw new Error(`Session cookie is blank!`)
      }
      this._sessionCookie = sessionCookie!.substring(0, sessionCookie!.indexOf(';'))
      this._restClient.defaults.headers.common['Cookie'] = this._sessionCookie
    } catch (e) {
      const msg = `Authentication failed: errorMessage=${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }

  private async checkClient() {
    try {
      await this._restClient.get('app/version')
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

  public async version(): Promise<string> {
    await this.checkAndInit()
    try {
      return (await this._restClient.get('app/version')).data
    } catch (e) {
      const msg = `Failed to get version: ${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }

  public async destroy() {
    try {
      if (await this.checkClient()) {
        await this._restClient.post('auth/logout')
      }
    } catch (e) {
      const msg = `Failed to destroy client: ${(e as Error).message}`
      console.warn(msg)
    }
  }

  public async deleteTorrentById(id: string) {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
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
      await this._restClient.post(`torrents/deleteTags`, {
        tags: id
      })
    } catch (e) {
      const msg = `Got error while deleting torrent: ${(e as Error).message}`
      console.warn(msg)
    }
  }

  async getTorrentById(id: string): Promise<Nullable<TorrentInfo>> {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    return (await this.getTorrentsByTag(id))[0];
  }

  private async getTorrentsByTag(tag: string): Promise<TorrentInfo[]> {
    await this.checkAndInit();
    try {
      const info = (await this._restClient.get(`torrents/info?tag=${encodeURIComponent(tag)}`)).data;
      let ret: TorrentInfo[] = [];
      for (let t of info) {
        const isStalled = t.state === "stalledDL" || t.state === "metaDL" ? true : false;
        const addedOn = t.added_on;
        const amountLeft = t.amount_left;
        const files = (await this._restClient.get(`torrents/files?hash=${t.hash}`)).data;
        ret.push({
          id : tag,
          infoHash : t.hash,
          addedOn : addedOn,
          isStalled : isStalled,
          amountLeft : amountLeft,
          files: files.map((f: any) => ({ name: f.name, size: f.size, progress: f.progress, index: f.index })),
          eta: t.eta,
          tags: t.tags.split(',').map((_: any) => _.trim()).filter((_: any) => _ !== tag)
        });
      }
      return ret;
    } catch (e) {
      const msg = `Got error while retrieving torrents: ${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }

  public async getEstimatedFreeSpace(): Promise<number> {
    await this.checkAndInit()
    try {
      const maindata = (await this._restClient.get('sync/maindata')).data
      let totalAmountLeft = 0
      for (let k of Object.keys(maindata.torrents)) {
        totalAmountLeft += maindata.torrents[k].amount_left
      }
      const freeSpaceOnDisk = maindata.server_state.free_space_on_disk
      return freeSpaceOnDisk - totalAmountLeft
    } catch (e) {
      const msg = `Got error while estimating free space: ${(e as Error).message}`
      throw new TorrentRuntimeError(msg)
    }
  }

  public async addTorrentByUrl(url: string, id: string, tags: Nullable<string[]>): Promise<TorrentInfo> {
    if (strIsBlank(url)) {
      const msg = 'Provided torrent url is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    if (strIsBlank(id)) {
      console.info('Provided id is blank, initializing with random string')
      id = uuidv4()
    }
    if (tags == null) tags = []
    await this.checkAndInit()
    try {
      await this._restClient.post('torrents/add', {
        urls: url,
        paused: true,
        tags: tags.join(',') + `,${id}`
      })
      let torrentInfo: Nullable<TorrentInfo> = null
      let tryCount = 5
      let resumed = false
      while ((torrentInfo == null || torrentInfo.files.length === 0) && tryCount-- > 0) {
        await new Promise(r => setTimeout(r, 5000))
        if (torrentInfo != null) {
          resumed = true
          await this.resumeTorrent(id)
        }
        torrentInfo = await this.getTorrentById(id)
      }
      if (resumed) {
        await this.pauseTorrent(id)
      }
      if (torrentInfo == null || torrentInfo.files.length === 0) {
        throw new TorrentError(`Failed to add torrent: torrentInfo=${JSON.stringify(torrentInfo)}`)
      }
      const infoHash = torrentInfo.infoHash
      let tagsAdded = true
      for (const t of tags) {
        if (torrentInfo == null || !torrentInfo.tags.includes(t)) {
          tagsAdded = false
        }
      }
      if (!tagsAdded) {
        tryCount = 2
        do {
          await this._restClient.post(`torrents/addTags`, {
            hashes: infoHash,
            tags: tags.join(',')
          })
          torrentInfo = await this.getTorrentById(id)
          tagsAdded = true
          for (const t of tags) {
            if (torrentInfo == null || !torrentInfo.tags.includes(t)) {
              tagsAdded = false
            }
          }
          await new Promise(r => setTimeout(r, 5000))
        } while (tryCount-- > 0 && !tagsAdded)
      }
      if (!tagsAdded) {
        const msg = `Failed to add tags: torrentInfo=${JSON.stringify(torrentInfo)}, tags=${tags}`
        throw new TorrentError(msg)
      }
      return torrentInfo!
    } catch (e) {
      if (e instanceof TorrentError) throw e
      const msg = `Failed to add torrent: ${(e as Error).message}`
      throw new TorrentRuntimeError(msg)
    }
  }

  public async resumeTorrent(id: string) {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    await this.checkAndInit();
    try {
      const ti = await this.getTorrentById(id)
      if (ti != null) {
        await this._restClient.post('torrents/resume', {
          hashes: ti.infoHash
        })
      }
    } catch (e) {
      const msg = `Got error while resuming torrent: ${(e as Error).message}`
      throw new TorrentRuntimeError(msg)
    }
  }

  public async pauseTorrent(id: string) {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    await this.checkAndInit()
    try {
      const ti = await this.getTorrentById(id)
      if (ti != null) {
        await this._restClient.post('torrents/pause', {
          hashes: ti.infoHash
        })
      }
    } catch (e) {
      const msg = `Got error while pausing torrent: ${(e as Error).message}`
      throw new TorrentRuntimeError(msg)
    }
  }

  public async disableAllFiles(id: string) {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    await this.checkAndInit()
    try {
      const ti = await this.getTorrentById(id)
      if (ti == null) {
        throw new Error(`Failed to get torrent by id=${id}`)
      }
      const files = (await this._restClient.get(`torrents/files?hash=${ti.infoHash}`)).data
      await this._restClient.post(`torrents/filePrio`, {
        hash: ti.infoHash,
        id: files.map((f: any) => f.index).join('|'),
        priority: 0
      })
    } catch (e) {
      const msg = `Got error while disabling files: ${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }

  public async enableFile(id: string, index: number) {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    if (index == null || index < 0 || !Number.isInteger(index)) {
      const msg = `Provided file index is invalid: index=${index}`
      console.error(msg)
      throw new Error(msg)
    }
    await this.checkAndInit()
    try {
      const ti = await this.getTorrentById(id)
      if (ti == null) {
        throw new Error(`Failed to get torrent by id=${id}`)
      }
      await this._restClient.post(`torrents/filePrio`, {
        hash: ti.infoHash,
        id: index,
        priority: 1
      })
    } catch (e) {
      const msg = `Got error while enabling file: ${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }

  async addTag(id: string, tag: string): Promise<TorrentInfo> {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    if (strIsBlank(tag)) {
      const msg = 'Provided tag is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    try {
      let t
      let retryCount = 3
      do {
        t = await this.getTorrentById(id)
        if (t == null) {
          throw new Error(`Failed to get torrent by id=${id}`)
        }
        await this._restClient.post(`torrents/addTags`, {
          hashes: t?.infoHash,
          tags: tag
        })
      } while (!t.tags.includes(tag) && retryCount-- > 0)
      if (!t.tags.includes(tag)) {
        const msg = `Failed add tag: id=${id}, tag=${tag}`
        throw new Error(msg)
      }
      return t
    } catch (e) {
      const msg = `Got error while adding tag: ${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }

  async removeTag(id: string, tag: string): Promise<TorrentInfo> {
    if (strIsBlank(id)) {
      const msg = 'Provided id is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    if (strIsBlank(tag)) {
      const msg = 'Provided tag is blank!'
      console.error(msg)
      throw new Error(msg)
    }
    try {
      let t
      let retryCount = 3
      do {
        t = await this.getTorrentById(id)
        if (t == null) {
          throw new Error(`Failed to get torrent by id=${id}`)
        }
        await this._restClient.post(`torrents/removeTags`, {
          hashes: t?.infoHash,
          tags: tag
        })
      } while (t.tags.includes(tag) && retryCount-- > 0)
      if (t.tags.includes(tag)) {
        const msg = `Failed to remove tag: id=${id}, tag=${tag}`
        throw new Error(msg)
      }
      return t
    } catch (e) {
      const msg = `Got error while removing tag: ${(e as Error).message}`
      console.error(msg)
      throw new TorrentRuntimeError(msg)
    }
  }
}
