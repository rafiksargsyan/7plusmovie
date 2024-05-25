import { Nullable } from "../../../Nullable";

export class SubsAuthor {
  public static readonly HDREZKA = new SubsAuthor("HDREZKA");
  public static readonly TVSHOWS = new SubsAuthor("TVSHOWS");

  private static readonly values = {
    HDREZKA: SubsAuthor.HDREZKA,
    TVSHOWS: SubsAuthor.TVSHOWS
  } as const;

  public readonly key;

  private constructor(key: string) {
    this.key = key;
  }

  static from(key: Nullable<string>): SubsAuthor {
    if (key == null || !(key in this.values)) {
      throw new InvalidSubsAuthorKeyError();
    }
    return this.values[key];
  }

  static fromTitle(title: string) {
    if (title.toLowerCase().includes("hdrezka")) return this.HDREZKA;
    if (title.toLowerCase().includes("tvshows")) return this.TVSHOWS;
    return null;
  }
}

export class InvalidSubsAuthorKeyError extends Error {}
