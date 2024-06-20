import { Nullable } from "./Nullable";

export class SubtitleType {
  public static readonly FORCED = new SubtitleType("FORCED", "Forced");
  public static readonly FULL = new SubtitleType("FULL", "Full");
  public static readonly SDH = new SubtitleType("SDH", "SDH");

  public readonly key: string;
  public readonly name: string;

  private constructor(key: string, name: string) {
    this.key = key;
    this.name = name;
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
