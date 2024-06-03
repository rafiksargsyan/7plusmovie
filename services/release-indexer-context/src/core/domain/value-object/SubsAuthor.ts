import { Nullable } from "../../../Nullable";

export class SubsAuthor {
  public static readonly HDREZKA = new SubsAuthor("HDREZKA");
  public static readonly TVSHOWS = new SubsAuthor("TVSHOWS");

  public readonly key;

  private constructor(key: string) {
    this.key = key;
  }

  static fromKeyOrThrow(key: string): SubsAuthor {
    if (key == null || SubsAuthor[key] == null) {
      throw new InvalidSubsAuthorKeyError();
    }
    return SubsAuthor[key];
  }

  static fromKey(key: Nullable<string>): Nullable<SubsAuthor> {
    if (key == null) return null;
    return SubsAuthor[key];
  }

  static fromTitle(title: string) {
    if (title == null) return null;
    const titleLowerCase = title.toLowerCase();
    if (titleLowerCase.includes("hdrezka")) return SubsAuthor.HDREZKA;
    if (titleLowerCase.includes("tvshows")) return SubsAuthor.TVSHOWS;
    return null;
  }
}

export class InvalidSubsAuthorKeyError extends Error {}
