import { Nullable } from "../../../Nullable";

export class TorrentTracker {
  public static readonly RUTRACKER = new TorrentTracker("RUTRACKER");
  
  private constructor(key: string) {
   this.key = key;
  }
  
  public readonly key;

  static fromKeyOrThrow(key: string): TorrentTracker {
    if (key == null || TorrentTracker[key] == null) {
      throw new InvalidTorrentTrackerKeyError();
    }
    return TorrentTracker[key];
  }

  static fromKey(key: string): Nullable<TorrentTracker> {
    if (key == null) {
      return null;
    }
    return TorrentTracker[key];
  }

  static fromRadarrReleaseGuid(guid: Nullable<string>) {
    if (guid == null) return null;
    if (guid.toLowerCase().includes("rutracker.org")) return TorrentTracker.RUTRACKER;
    return null;
  }

  static fromRadarrReleaseIndexerName(name: Nullable<string>) {
    if (name == null) return null;
    if (name.toLowerCase().includes("rutracker")) return TorrentTracker.RUTRACKER;
    return null;
  }
}

export class InvalidTorrentTrackerKeyError extends Error {}
