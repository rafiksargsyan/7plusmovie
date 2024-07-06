import { Nullable } from "../../utils";

export class Resolution {
  public static readonly SD = new Resolution("SD", 1); // under 480p
  public static readonly HD = new Resolution("HD", 2); // under 720p
  public static readonly FHD = new Resolution("FHD", 3); // above 1080p

  public readonly key;
  private readonly priority: number;

  private constructor(k: string, p: number) {
    this.priority = p;
    this.key = k;
  }

  static fromKeyOrThrow(key: string): Resolution {
    if (key == null || Resolution[key] == null) {
      throw new InvalidResolutionKeyError();
    }
    return Resolution[key];
  }

  static fromKey(key: Nullable<string>): Nullable<Resolution> {
    if (key == null) return null;
    return Resolution[key];
  }

  static fromPixels(d1: Nullable<number>, d2: Nullable<number>): Nullable<Resolution> {
    if (d1 == null) d1 = 0;
    if (d2 == null) d2 = 0;
    const min = Math.min(d1, d2);
    if (min === 0) return null;
    if (min <= 480) return this.SD;
    if (min <= 720) return this.HD;
    return this.FHD;
  }
  
  static fromPixelsOrThrow(d1: Nullable<number>, d2: Nullable<number>): Resolution {
    const r = this.fromPixels(d1, d2);
    if (r == null) throw new FailedToResolveResolutionError();
    return r;
  }

  static compare(r1: Nullable<Resolution>, r2: Nullable<Resolution>) {
    if (r1 == null && r2 != null) return -1;
    if (r1 != null && r2 == null) return 1;
    if (r1?.key == r2?.key) return 0;
    return (r1 as Resolution).priority < (r2 as Resolution).priority ? -1 : 1;
  }
}

export class InvalidResolutionKeyError extends Error {}

export class FailedToResolveResolutionError extends Error {}
