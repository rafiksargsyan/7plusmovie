import { Nullable } from "../../../Nullable";

export class TorrentTracker {
  public static readonly RUTRACKER = new TorrentTracker("RUTRACKER");
  public static readonly RUTOR = new TorrentTracker("RUTOR");
  
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
    guid = guid.toLowerCase();

    if (guid.includes("rutracker.org")) return TorrentTracker.RUTRACKER;
    if (guid.includes("rutor.info")) return TorrentTracker.RUTOR
    return null;
  }

  static fromRadarrReleaseIndexerName(name: Nullable<string>) {
    if (name == null) return null;
    name = name.toLowerCase();
    if (name.includes("rutracker")) return TorrentTracker.RUTRACKER;
    if (name.includes("rutor")) return TorrentTracker.RUTOR;
    return null;
  }

  static equals(tt1: Nullable<TorrentTracker>, tt2: Nullable<TorrentTracker>) {
    return this.fromKey(tt1?.key) == this.fromKey(tt2?.key);
  }
}

export class InvalidTorrentTrackerKeyError extends Error {}
