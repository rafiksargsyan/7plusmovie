import { Nullable } from "../../../Nullable";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { TorrentTracker } from "../value-object/TorrentTracker";
import { ReleaseCandidate } from "./ReleaseCandidate"

export class TorrentReleaseCandidate extends ReleaseCandidate {
  private _tracker: TorrentTracker;
  private _infoHash: string;
  private _downloadUrl: string;
  private _infoUrl: Nullable<string>;
  private _seeders: number;

  public constructor(createEmptyObject: boolean, releaseTime?: Nullable<number>, downloadUrl?: string,
    sizeInBytes?: Nullable<number>, res?: Resolution, ripType?: RipType, tracker?: TorrentTracker, infoHash?: string,
    infoUrl?: string, seeders?: number) {
    super(createEmptyObject, releaseTime, sizeInBytes, res, ripType);
    if (!createEmptyObject) {
      this._tracker = this.validateTracker(tracker);
      this._infoHash = this.validateInfoHash(infoHash);
      this._downloadUrl = this.validateDownloadUrl(downloadUrl);
      this._infoUrl = infoUrl;
      if (seeders == null) seeders = 0;
      this._seeders = seeders;
    }
  }

  private validateTracker(tracker: Nullable<TorrentTracker>) {
    if (tracker == null) {
      throw new NullTorrentTrackerError();
    }
    return tracker;
  }

  private validateInfoHash(hash: Nullable<string>) {
    if (hash == null || ! /\S/.test(hash)) {
      throw new EmptyInfoHashError();
    }
    return hash;
  }

  private validateDownloadUrl(url: Nullable<string>) {
    if (url == null || ! /\S/.test(url)) {
      throw new EmptyDownloadUrlError();
    }
    return url;
  }

  get infoHash() {
    return this._infoHash;
  }

  get tracker() {
    return this._tracker;
  }

  get downloadUrl() {
    return this._downloadUrl;
  }

  get seeders() {
    return this._seeders;
  }
}

export class EmptyInfoHashError extends Error {}

export class NullTorrentTrackerError extends Error {}

export class EmptyDownloadUrlError extends Error {}

export type TorrentReleaseCandidateType = TorrentReleaseCandidate;
