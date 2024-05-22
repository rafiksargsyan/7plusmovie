import { Nullable } from "../../../Nullable";

export class SubsType {
  public static readonly FORCED = new SubsType();
  public static readonly FULL = new SubsType();
  public static readonly SDH = new SubsType();

  private static readonly values = {
    FORCED: SubsType.FORCED,
    FULL: SubsType.FULL,
    SDH: SubsType.SDH,
  } as const;

  static from(key: Nullable<string>): SubsType {
    if (key == null || !(key in this.values)) {
      throw new InvalidSubsTypeKeyError();
    }
    return this.values[key];
  }

}

class InvalidSubsTypeKeyError extends Error {}
