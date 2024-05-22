import { Nullable } from "../../../Nullable";

export class Resolution {
    public static readonly SD = new Resolution(0); // under 480p
    public static readonly HD = new Resolution(1); // under 720p
    public static readonly FHD = new Resolution(2); // above 1080p

    private static readonly values = {
      SD: Resolution.SD,
      HD: Resolution.HD,
      FHD: Resolution.FHD,
    } as const;
  
    private readonly ordinal: number;

    private constructor(o: number) {
      this.ordinal = o;
    }

    static from(key: Nullable<string>): Resolution {
      if (key == null || !(key in this.values)) {
        throw new InvalidResolutionKeyError();
      }
      return this.values[key];
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

    static compare(r1: Nullable<Resolution>, r2: Nullable<Resolution>) {
      if (r1 == null && r2 != null) return -1;
      if (r1 != null && r2 == null) return 1;
      if (r1 == r2) return 0;
      return (r1 as Resolution).ordinal < (r2 as Resolution).ordinal ? -1 : 1;
    }
}

export class InvalidResolutionKeyError extends Error {}
