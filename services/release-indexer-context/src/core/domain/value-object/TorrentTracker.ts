import { Nullable } from "../../../Nullable";

export class TorrentTracker {
  public static readonly RUTRACKER = new TorrentTracker();

  private static readonly values = {
    RUTRACKER: TorrentTracker.RUTRACKER,
  } as const;
  
  private constructor() { }
  
  static from(key: Nullable<string>): TorrentTracker {
    if (key == null || !(key in this.values)) {
      throw new InvalidTorrentTrackerKeyError();
    }
    return this.values[key];
  }
}

export class InvalidTorrentTrackerKeyError extends Error {}
