import { Nullable } from "../../../Nullable";

export class RipType {
  public static readonly CAM = new RipType("CAM", 0);
  public static readonly WEB = new RipType("WEB", 1);
  public static readonly BR = new RipType("BR", 2);
  
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

  static fromRadarrReleaseQualitySource(s: Nullable<string>) {
    if (s == null) return null;
    if (s.toLowerCase().includes("bluray")) return RipType.BR;
    if (s.toLowerCase().includes("web")) return RipType.WEB;
    if (s.toLowerCase().includes("cam")) return RipType.CAM;
    return null;
  }
}

class InvalidRipTypeKeyError extends Error {}
