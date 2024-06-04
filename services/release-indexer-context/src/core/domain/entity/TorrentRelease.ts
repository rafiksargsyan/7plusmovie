import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { TorrentTracker } from "../value-object/TorrentTracker";
import { Release } from "./Release";

export class TorrentRelease extends Release {
  private _tracker: TorrentTracker;
  private _torrentFileUrl: string;

  public constructor(ripType: RipType, res: Resolution, hash: string, mediaFileRelativePath: string,
    tracker: TorrentTracker, torrentFileUrl: string) {
    super(ripType, res, hash, mediaFileRelativePath);
    this._tracker = this.validateTracker(tracker);
    this._torrentFileUrl = this.validateTorrentFileUrl(torrentFileUrl);
  }

  private validateTracker(tracker: TorrentTracker) {
    if (tracker == null) throw new NullTorrentTrackerError();
    return tracker;
  }

  private validateTorrentFileUrl(url: string) {
    if (url == null || url.trim().length === 0) {
      throw new InvalidTorrentFileUrlError();
    }
    return url;
  }
}

export class NullTorrentTrackerError extends Error {};

export class InvalidTorrentFileUrlError extends Error {};
