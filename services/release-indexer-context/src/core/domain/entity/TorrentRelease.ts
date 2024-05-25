import { Nullable } from "../../../Nullable";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { TorrentTracker } from "../value-object/TorrentTracker";
import { Release } from "./Release";

export class TorrentRelease extends Release {
  private _tracker: TorrentTracker;
  private _torrentFileUrl: string;

  public constructor(ripType: Nullable<RipType>, res: Nullable<Resolution>, tracker: Nullable<TorrentTracker>, hash: Nullable<string>) {
    super(ripType, res, hash);
    this._tracker = this.validateTracker(tracker);
  }

  private validateTracker(tracker: Nullable<TorrentTracker>) {
    if (tracker == null) throw new NullTorrentTrackerError();
    return tracker;
  }
}

export class NullTorrentTrackerError extends Error {};
