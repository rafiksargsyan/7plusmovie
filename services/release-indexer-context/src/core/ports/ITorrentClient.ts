import { Nullable } from "../../utils"

export interface ITorrentClient {
  version(): Promise<string>
  deleteTorrentById(id: string): void
  getTorrentById(id: string): Promise<Nullable<TorrentInfo>>
  getEstimatedFreeSpace(): Promise<number>
  addTorrentByUrl(url: string, id: string, tags: Nullable<string[]>): Promise<TorrentInfo>
  resumeTorrent(id: string): void
  pauseTorrent(id: string): void
  disableAllFiles(id: string): void
  enableFile(id: string, fileId: number): void
  addTag(id: string, tag: string): Promise<TorrentInfo>
  removeTag(id: string, tag: string): Promise<TorrentInfo>
}

export interface TorrentInfo {
  id: string;
  infoHash: string;
  addedOn: number; // epoch seconds
  amountLeft: number; // bytes
  isStalled: boolean;
  files: { name: string, size: number, progress: number, index: number } []
  eta: Nullable<number>; // seconds
  tags: string[];
}

export class TorrentRuntimeError extends Error {
  constructor(msg: string | undefined) {
    super(msg)
    this.name = 'TorrentRuntimeError'
  }
}

export class TorrentError extends Error {
  constructor(msg: string | undefined) {
    super(msg)
    this.name = 'TorrentError'
  }
}
