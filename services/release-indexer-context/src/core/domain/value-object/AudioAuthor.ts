import { Nullable } from "../../../Nullable";

export class AudioAuthor {
  public static readonly HDREZKA = new AudioAuthor("HDREZKA");
  public static readonly TVSHOWS = new AudioAuthor("TVSHOWS");
  public static readonly LOSTFILM = new AudioAuthor("LOSTFILM");
  public static readonly BRAVO_RECORDS_GEORGIA = new AudioAuthor("BRAVO_RECORDS_GEORGIA");
  public static readonly READ_HEAD_SOUND = new AudioAuthor("READ_HEAD_SOUND");
  public static readonly JASKIER = new AudioAuthor("JASKIER");
  public static readonly VIRUSEPROJECT = new AudioAuthor("VIRUSEPROJECT");
 
  public readonly key;

  private constructor(key: string) {
    this.key = key;
  }

  static fromKeyOrThrow(key: string): AudioAuthor {
    if (key == null || AudioAuthor[key] == null) {
      throw new InvalidAudioAuthorKeyError();
    }
    return AudioAuthor[key];
  }

  static fromKey(key: Nullable<string>): Nullable<AudioAuthor> {
    if (key == null) return null;
    return AudioAuthor[key];
  }

  static fromTitle(title: Nullable<string>) {
    if (title == null) return null;
    if (title.toLowerCase().includes('hdrezka')) return AudioAuthor.HDREZKA;
    if (title.toLowerCase().includes('tvshows')) return AudioAuthor.TVSHOWS;
    if (title.toLowerCase().includes('viruseproject') || title.toLowerCase().includes('viruse project')) return AudioAuthor.VIRUSEPROJECT;
    return null;
  }

  static equals(a1: Nullable<AudioAuthor>, a2: Nullable<AudioAuthor>) {
    return a1?.key == a2?.key;
  }
}

export class InvalidAudioAuthorKeyError extends Error {}
