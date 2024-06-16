import { Nullable } from "../../../Nullable";

export class SubsType {
  public static readonly FORCED = new SubsType("FORCED");
  public static readonly FULL = new SubsType("FULL");
  public static readonly SDH = new SubsType("SDH");

  public readonly key;

  private constructor(key: string) {
    this.key = key;
  }

  static fromKeyOrThrow(key: string): SubsType {
    if (key == null || SubsType[key] == null) {
      throw new InvalidSubsTypeKeyError();
    }
    return SubsType[key];
  }

  static fromKey(key: Nullable<string>): Nullable<SubsType> {
    if (key == null) return null;
    return SubsType[key];
  }

  static fromTitle(title: Nullable<string>) {
    if (title == null) return null;
    const titleLowerCase = title.toLowerCase();
    if (titleLowerCase.includes("forced") || titleLowerCase.includes("форсирован") || titleLowerCase.includes("forzados")) return SubsType.FORCED;
    if (titleLowerCase.includes("sdh") || titleLowerCase.includes("non udenti")) return SubsType.SDH;
    if (titleLowerCase.includes("full") || titleLowerCase.includes("полные") ||
        titleLowerCase.includes("regular")  || titleLowerCase.includes("completi") || titleLowerCase.includes("completos")) return SubsType.FULL;
    return null;
  }

  static equals(st1: Nullable<SubsType>, st2: Nullable<SubsType>) {
    return st1?.key == st2?.key;
  }
}

class InvalidSubsTypeKeyError extends Error {}
