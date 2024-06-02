import { Nullable } from "../../../Nullable";

export class RipType {
  public static readonly CAM = new RipType("CAM", 0);
  public static readonly WEB = new RipType("WEB", 1);
  public static readonly BR = new RipType("BR", 2);

  private static readonly values = {
    CAM: RipType.CAM,
    WEB: RipType.WEB,
    BR: RipType.BR,
  } as const;
  
  public readonly key;
  private readonly priority: number;

  private constructor(k: string, priority: number) {
    this.priority = priority;
    this.key = k
  }

  static from(key: Nullable<string>): RipType {
    if (key == null || !(key in this.values)) {
      throw new InvalidRipTypeKeyError();
    }
    return this.values[key];
  }

  static compare(r1: Nullable<RipType>, r2: Nullable<RipType>) {
    if (r1 == null && r2 != null) return -1;
    if (r1 != null && r2 == null) return 1;
    if (r1 == r2) return 0;
    return (r1 as RipType).priority - (r2 as RipType).priority;
  }

  static fromRadarrReleaseQualitySource(s: Nullable<string>) {
    if (s == null) return null;
    if (s.toLowerCase().includes("bluray")) return RipType.BR;
    if (s.toLowerCase().includes("web")) return RipType.WEB;
    return null;
  }
}

class InvalidRipTypeKeyError extends Error {}
