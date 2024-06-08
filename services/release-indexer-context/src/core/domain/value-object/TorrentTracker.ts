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
  public static readonly CINECALIDAD = new TorrentTracker("CINECALIDAD");
  public static readonly RARBG = new TorrentTracker("RARBG")

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

  static fromRadarrInfoCommentUrl(url: Nullable<string>) {
    if (url == null) return null;
    url = url.toLowerCase();
    if (url.includes("rutracker.org")) return TorrentTracker.RUTRACKER;
    if (url.includes("rutor.info")) return TorrentTracker.RUTOR;
    if (url.includes("thepiratebay")) return TorrentTracker.THE_PIRATE_BAY;
    if (url.includes("limetorrents")) return TorrentTracker.LIMETORRENT;
    if (url.includes("1337x")) return TorrentTracker.X1337;
    if (url.includes("dontorrent")) return TorrentTracker.DONTORRENT;
    if (url.includes("corsaronero")) return TorrentTracker.CORSARO_NERO;
    if (url.includes("oxtorrent")) return TorrentTracker.OXTORRENT;
    if (url.includes("cinecalidad")) return TorrentTracker.CINECALIDAD;
    if (url.includes("therarbg")) return TorrentTracker.RARBG
    return null;
  }

  static fromRadarrReleaseIndexerName(name: Nullable<string>) {
    if (name == null) return null;
    name = name.toLowerCase();
    if (name.includes("rutracker")) return TorrentTracker.RUTRACKER;
    if (name.includes("rutor")) return TorrentTracker.RUTOR;
    if (name.includes("1337x")) return TorrentTracker.X1337;
    if (name.includes("the pirate bay")) return TorrentTracker.THE_PIRATE_BAY;
    if (name.includes("oxtorrent")) return TorrentTracker.OXTORRENT;
    if (name.includes("limetorrent")) return TorrentTracker.LIMETORRENT;
    if (name.includes("dontorrent")) return TorrentTracker.DONTORRENT;
    if (name.includes("corsaro nero")) return TorrentTracker.CORSARO_NERO;
    if (name.includes("cinecalidad")) return TorrentTracker.CINECALIDAD;
    if (name.includes("rarbg")) return TorrentTracker.RARBG;
    return null;
  }

  static equals(tt1: Nullable<TorrentTracker>, tt2: Nullable<TorrentTracker>) {
    return tt1?.key == tt2?.key;
  }
}

export class InvalidTorrentTrackerKeyError extends Error {}
