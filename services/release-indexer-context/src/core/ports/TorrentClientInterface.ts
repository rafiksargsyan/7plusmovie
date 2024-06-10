import { Nullable } from "../../Nullable";

export interface TorrentClientInterface {
  deleteTorrentByHash(hash: string);
  getTorrentByHash(hash: string): Promise<Nullable<TorrentInfo>>;
  getTorrentByHashOrThrow(hash: string);
  getAllTorrents(): Promise<TorrentInfo[]>;
  getTorrentsByTag(tag: string): Promise<TorrentInfo[]>;
  isTaggingSupported(): boolean;
  getEstimatedFreeSpace(): Promise<number>;
  addTorrentByUrl(url: string);
  addTagToTorrent(hash: string, tag: string);
  removeTagFromTorrent(hash: string, tag: string);
  resumeTorrent(hash: string);
  pauseTorrent(hash: string);
  disableAllFiles(hash: string);
  enableFile(hash: string, id: number);
}

export interface TorrentInfo {
  hash: string;
  addedOn: number; // epoch seconds
  amountLeft: number; // bytes
  isStalled: boolean;
  tags: string[];
  files: { name: string, size: number, progress: number, index: number } []
  eta: Nullable<number>; // seconds
}

export class TorrentApiError extends Error {
  public constructor(msg: string | undefined) {
    super(msg);
  }
}

export class TorrentNotFoundError extends Error {}
