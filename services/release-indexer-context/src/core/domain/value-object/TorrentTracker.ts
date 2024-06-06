import { Nullable } from "../../../Nullable";

export class TorrentTracker {
  public static readonly RUTRACKER = new TorrentTracker("RUTRACKER");
  public static readonly RUTOR = new TorrentTracker("RUTOR");
  public static readonly X1337 = new TorrentTracker("X1337");
  public static readonly THE_PIRATE_BAY = new TorrentTracker("THE_PIRATE_BAY");
  public static readonly OXTORRENT = new TorrentTracker("OXTORRENT");
  public static readonly LIMETORRENT = new TorrentTracker("LIMETORRENT");
  public static readonly DONTORRENT = new TorrentTracker("DONTORRENT");
  public static readonly CORSARO_NERO = new TorrentTracker("CORSARO_NERO");

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
    if (guid.includes("rutor.info")) return TorrentTracker.RUTOR;
    if (guid.includes("thepiratebay")) return TorrentTracker.THE_PIRATE_BAY;
    if (guid.includes("limetorrents")) return TorrentTracker.LIMETORRENT;
    if (guid.includes("1337x")) return TorrentTracker.X1337;
    if (guid.includes("dontorrent")) return TorrentTracker.DONTORRENT;
    if (guid.includes("corsaronero")) return TorrentTracker.CORSARO_NERO;
    if (guid.includes("oxtorrent")) return TorrentTracker.OXTORRENT;
    return null;
  }

  static fromRadarrReleaseIndexerName(name: Nullable<string>) {
    if (name == null) return null;
    name = name.toLowerCase();
    if (name.includes("rutracker")) return TorrentTracker.RUTRACKER;
    if (name.includes("rutor")) return TorrentTracker.RUTOR;
    if (name.includes("1337x")) return TorrentTracker.X1337;
    if (name.includes("the priate bay")) return TorrentTracker.THE_PIRATE_BAY;
    if (name.includes("oxtorrent")) return TorrentTracker.OXTORRENT;
    if (name.includes("limetorrent")) return TorrentTracker.LIMETORRENT;
    if (name.includes("dontorrent")) return TorrentTracker.DONTORRENT;
    if (name.includes("corsaro nero")) return TorrentTracker.CORSARO_NERO;
    return null;
  }

  static equals(tt1: Nullable<TorrentTracker>, tt2: Nullable<TorrentTracker>) {
    return this.fromKey(tt1?.key) == this.fromKey(tt2?.key);
  }
}

export class InvalidTorrentTrackerKeyError extends Error {}
