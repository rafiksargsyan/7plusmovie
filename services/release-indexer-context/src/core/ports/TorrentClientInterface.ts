import { Nullable } from "../../Nullable";

export interface TorrentClientInterface {
  deleteTorrentById(id: string);
  getTorrentById(id: string): Promise<Nullable<TorrentInfo>>;
  getTorrentByIdOrThrow(hash: string);
  getEstimatedFreeSpace(): Promise<number>;
  addTorrentByUrlOrThrow(url: string, hash: string): Promise<TorrentInfo>;
  resumeTorrent(id: string);
  pauseTorrent(id: string);
  disableAllFiles(id: string);
  enableFile(id: string, fileId: number);
  addTag(id: string, tag: string);
  removeTag(id: string, tag: string);
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

export class TorrentApiError extends Error {
  public constructor(msg: string | undefined) {
    super(msg);
  }
}

export class TorrentNotFoundError extends Error {}
