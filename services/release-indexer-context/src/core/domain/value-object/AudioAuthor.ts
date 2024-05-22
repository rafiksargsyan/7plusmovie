import { Nullable } from "../../../Nullable";

export class AudioAuthor {
  public static readonly HDREZKA = new AudioAuthor(0);
  public static readonly TVSHOWS = new AudioAuthor(1);

  private static readonly values = {
    HDREZKA: AudioAuthor.HDREZKA,
    TVSHOWS: AudioAuthor.TVSHOWS
  } as const;

  private readonly priority;

  private constructor(p: number) {
    this.priority = p;
  }

  static from(key: Nullable<string>): AudioAuthor {
    if (key == null || !(key in this.values)) {
      throw new InvalidAudioAuthorKeyError();
    }
    return this.values[key];
  }

  static fromTitle(title: string) {
    if (title.toLowerCase().includes("hdrezka")) return this.HDREZKA;
    if (title.toLowerCase().includes("tvshows")) return this.TVSHOWS;
    return null;
  }
}

export class InvalidAudioAuthorKeyError extends Error {}