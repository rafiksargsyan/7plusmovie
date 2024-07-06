import { Nullable } from "../../utils";

export class RipType {
  public static readonly CAM = new RipType("CAM", 0);
  public static readonly TELESYNC = new RipType("TELESYNC", 1);
  public static readonly DVD = new RipType("DVD", 2);
  public static readonly HDTV = new RipType("HDTV",3);
  public static readonly WEB = new RipType("WEB", 4);
  public static readonly BR = new RipType("BR", 5);
  
  public readonly key;
  private readonly priority: number;

  private constructor(k: string, priority: number) {
    this.priority = priority;
    this.key = k
  }

  static fromKeyOrThrow(key: string): RipType {
    if (key == null || RipType[key] == null) {
      throw new InvalidRipTypeKeyError();
    }
    return RipType[key];
  }

  static fromKey(key: Nullable<string>): Nullable<RipType> {
    if (key == null) return null;
    return RipType[key];
  }

  static compare(r1: Nullable<RipType>, r2: Nullable<RipType>) {
    if (r1 == null && r2 != null) return -1;
    if (r1 != null && r2 == null) return 1;
    if (r1?.key == r2?.key) return 0;
    return (r1 as RipType).priority - (r2 as RipType).priority;
  }

  static fromRadarrReleaseQualityName(s: Nullable<string>) {
    if (s == null) return null;
    s = s.toLowerCase();
    if (s.includes("bluray")) return RipType.BR;
    if (s.includes("web")) return RipType.WEB;
    if (s.includes("cam")) return RipType.CAM;
    if (s.includes("telesync")) return RipType.TELESYNC;
    if (s.includes("hdtv")) return RipType.HDTV;
    if (s.includes("dvd")) return RipType.DVD;
    return null;
  }

  static fromRadarrReleaseQualityNameOrThrow(s: Nullable<string>) {
    const ripType = this.fromRadarrReleaseQualityName(s);
    if (ripType == null) {
      throw new InvalidRadarrQualitySourceError();
    }
    return ripType;
  }

  public isLowQuality() {
    return RipType.compare(this, RipType.TELESYNC) === 0 || RipType.compare(this, RipType.CAM) === 0;
  }
}

class InvalidRipTypeKeyError extends Error {}

class InvalidRadarrQualitySourceError extends Error {}
