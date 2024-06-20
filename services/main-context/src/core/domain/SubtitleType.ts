import { Nullable } from "./Nullable";

export class SubtitleType {
  public static readonly FORCED = new SubtitleType("FORCED");
  public static readonly FULL = new SubtitleType("FULL");
  public static readonly SDH = new SubtitleType("SDH");

  readonly key: string;
    
  private constructor(key: string) {
    this.key = key;
  }

  static fromKeyOrThrow(key: string): SubtitleType {
    if (key == null || SubtitleType[key] == null) {
      throw new InvalidSubtitleTypeKeyError();
    }
    return SubtitleType[key];
  }

  static fromKey(key: Nullable<string>): Nullable<SubtitleType> {
    if (key == null) return null;
    return SubtitleType[key];
  }
}
  
class InvalidSubtitleTypeKeyError extends Error {}
