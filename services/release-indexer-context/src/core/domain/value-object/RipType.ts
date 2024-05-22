import { Nullable } from "../../../Nullable";

export class RipType {
    public static readonly CAM = new RipType();
    public static readonly WEB = new RipType();
    public static readonly BR = new RipType();

    private static readonly values = {
      CAM: RipType.CAM,
      WEB: RipType.WEB,
      BR: RipType.BR,
    } as const;
  
    static from(key: Nullable<string>): RipType {
      if (key == null || !(key in this.values)) {
        throw new InvalidRipTypeKeyError();
      }
      return this.values[key];
    }
}

class InvalidRipTypeKeyError extends Error {}
