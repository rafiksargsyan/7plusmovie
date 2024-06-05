import { Nullable } from "../../../Nullable";

export class SubsAuthor {
  public static readonly HDREZKA = new SubsAuthor("HDREZKA");
  public static readonly HDREZKA_18PLUS = new SubsAuthor("HDREZKA_18PLUS");
  public static readonly TVSHOWS = new SubsAuthor("TVSHOWS");
  public static readonly VIRUSEPROJECT = new SubsAuthor("VIRUSEPROJECT");
  public static readonly VIRUSEPROJECT_18PLUS = new SubsAuthor("VIRUSEPROJECT_18PLUS");
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

  static fromTitle(title: string) {
    if (title == null) return null;
    const titleLowerCase = title.toLowerCase();
    const hdrezak18PlusRegex = /hdrezka.*18\+/;
    const viruseProject18PlusRegex = /viruseproject.*18\+/;
    const coolStoryBlogRegex = /cool.*story.*blog/;
    const coolStoryBlog18PlusRegex = /cool.*story.*blog.*18\+/;
    if (titleLowerCase.match(hdrezak18PlusRegex) != null) return SubsAuthor.HDREZKA_18PLUS;
    if (titleLowerCase.match(viruseProject18PlusRegex) != null) return SubsAuthor.VIRUSEPROJECT_18PLUS;
    if (titleLowerCase.match(coolStoryBlog18PlusRegex) != null) return SubsAuthor.COOL_STORY_BLOG_18PLUS;
    if (titleLowerCase.includes("hdrezka")) return SubsAuthor.HDREZKA;
    if (titleLowerCase.includes("tvshows")) return SubsAuthor.TVSHOWS;
    if (titleLowerCase.includes('viruseproject')) return SubsAuthor.VIRUSEPROJECT;
    if (titleLowerCase.match(coolStoryBlogRegex)) return SubsAuthor.COOL_STORY_BLOG;
    return null;
  }

  static equals(s1: Nullable<SubsAuthor>, s2: Nullable<SubsAuthor>) {
    return s1?.key == s2?.key;
  }
}

export class InvalidSubsAuthorKeyError extends Error {}
