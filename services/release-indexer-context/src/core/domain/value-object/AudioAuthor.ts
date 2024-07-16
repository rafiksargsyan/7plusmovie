import { Nullable } from "../../../Nullable";

export class AudioAuthor {
  public static readonly HDREZKA = new AudioAuthor("HDREZKA");
  public static readonly HDREZKA_18PLUS = new AudioAuthor("HDREZKA_18PLUS");
  public static readonly TVSHOWS = new AudioAuthor("TVSHOWS");
  public static readonly LOSTFILM = new AudioAuthor("LOSTFILM");
  public static readonly BRAVO_RECORDS_GEORGIA = new AudioAuthor("BRAVO_RECORDS_GEORGIA");
  public static readonly READ_HEAD_SOUND = new AudioAuthor("READ_HEAD_SOUND");
  public static readonly JASKIER = new AudioAuthor("JASKIER");
  public static readonly JASKIER_18PLUS = new AudioAuthor("JASKIER_18PLUS");
  public static readonly VIRUSEPROJECT = new AudioAuthor("VIRUSEPROJECT");
  public static readonly VIRUSEPROJECT_18PLUS = new AudioAuthor("VIRUSEPROJECT_18PLUS");
  public static readonly MOVIE_DALEN = new AudioAuthor("MOVIE_DALEN");
  public static readonly POSTMODERN = new AudioAuthor("POSTMODERN");
  public static readonly KIRILLICA = new AudioAuthor("KIRILLICA");
  public static readonly IVI = new AudioAuthor("IVI");
  public static readonly KINOMANIA = new AudioAuthor("KINOMANIA");
  public static readonly ONE_PLUS_ONE = new AudioAuthor("ONE_PLUS_ONE");
  public static readonly KINAKONG = new AudioAuthor("KINAKONG");
  public static readonly MOVIE_DUBBING = new AudioAuthor("MOVIE_DUBBING");
  public static readonly PIFAGOR = new AudioAuthor("PIFAGOR");

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

  static equals(a1: Nullable<AudioAuthor>, a2: Nullable<AudioAuthor>) {
    return a1?.key == a2?.key;
  }
}

export class InvalidAudioAuthorKeyError extends Error {}
