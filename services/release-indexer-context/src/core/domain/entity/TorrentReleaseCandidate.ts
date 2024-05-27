import { Nullable } from "../../../Nullable";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { TorrentTracker } from "../value-object/TorrentTracker";
import { ReleaseCandidate } from "./ReleaseCandidate"

export class TorrentReleaseCandidate extends ReleaseCandidate {
  private _tracker: TorrentTracker;
  private _infoHash: string;

  public constructor(createEmptyObject: boolean, releaseTime?: Nullable<number>,
    sizeInBytes?: Nullable<number>, res?: Resolution, ripType?: RipType, tracker?: TorrentTracker, infoHash?: string) {
    super(createEmptyObject, releaseTime, sizeInBytes, res, ripType);
    if (!createEmptyObject) {
      this._tracker = this.validateTracker(tracker);
      this._infoHash = this.validateInfoHash(infoHash);
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

  get infoHash() {
    return this._infoHash;
  }

  get tracker() {
    return this._tracker;
  }
}

export class EmptyInfoHashError extends Error {}

export class NullTorrentTrackerError extends Error {}
