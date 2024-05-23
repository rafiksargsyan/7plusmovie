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

  static fromTitle(title: Nullable<string>) {
    if (title == null) return null;
    const titleLowerCase = title.toLowerCase();
    if (titleLowerCase.includes("forced") || titleLowerCase.includes("форсирован")) return SubsType.FORCED;
    if (titleLowerCase.includes("full") || titleLowerCase.includes("полные")) return SubsType.FULL;
    if (titleLowerCase.includes("sdh")) return SubsType.SDH;
    return null;
  }
}

class InvalidSubsTypeKeyError extends Error {}
