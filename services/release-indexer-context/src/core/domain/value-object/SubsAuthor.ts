import { Nullable } from "../../../Nullable";

export class SubsAuthor {
  public static readonly HDREZKA = new SubsAuthor("HDREZKA");
  public static readonly HDREZKA_18PLUS = new SubsAuthor("HDREZKA_18PLUS");
  public static readonly TVSHOWS = new SubsAuthor("TVSHOWS");
  public static readonly COOL_STORY_BLOG = new SubsAuthor("COOL_STORY_BLOG");
  public static readonly COOL_STORY_BLOG_18PLUS = new SubsAuthor("COOL_STORY_BLOG_18PLUS");

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

  static equals(s1: Nullable<SubsAuthor>, s2: Nullable<SubsAuthor>) {
    return s1?.key == s2?.key;
  }
}

export class InvalidSubsAuthorKeyError extends Error {}
