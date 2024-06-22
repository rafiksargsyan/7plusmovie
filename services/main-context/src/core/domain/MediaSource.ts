import { Nullable } from "../../utils";

export class MediaSource {
  public static readonly EXTERNAL = new MediaSource("EXTERNAL");
  public static readonly ADMIN = new MediaSource("ADMIN");

  public readonly key: string;
    
  private constructor(key: string) {
    this.key = key;
  }

  static fromKeyOrThrow(key: string): MediaSource {
    if (key == null || MediaSource[key] == null) {
      throw new InvalidMediaSourceKeyError();
    }
    return MediaSource[key];
  }

  static fromKey(key: Nullable<string>): Nullable<MediaSource> {
    if (key == null) return null;
    return MediaSource[key];
  }
}
  
class InvalidMediaSourceKeyError extends Error {}
