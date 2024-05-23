import { Nullable } from "../../../Nullable";

export class AudioAuthor {
  public static readonly HDREZKA = new AudioAuthor();
  public static readonly TVSHOWS = new AudioAuthor();
  public static readonly LOSTFILM = new AudioAuthor();

  private static readonly values = {
    HDREZKA: AudioAuthor.HDREZKA,
    TVSHOWS: AudioAuthor.TVSHOWS,
    LOSTFILM: AudioAuthor.LOSTFILM
  } as const;

  static from(key: Nullable<string>): AudioAuthor {
    if (key == null || !(key in this.values)) {
      throw new InvalidAudioAuthorKeyError();
    }
    return this.values[key];
  }

}

export class InvalidAudioAuthorKeyError extends Error {}
