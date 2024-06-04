import { Nullable } from "../../../Nullable";

export class AudioVoiceType {
  public static readonly DUB = new AudioVoiceType("DUB", 3);
  public static readonly MVO = new AudioVoiceType("MVO", 2);
  public static readonly DVO = new AudioVoiceType("DVO", 1);
  public static readonly SO = new AudioVoiceType("SO", 0);
  public static readonly ORIGINAL = new AudioVoiceType("ORIGINAL", 4);

  private readonly key;
  private readonly priority;

  private constructor(key: string, p: number) {
    this.key = key;
    this.priority = p;
  }

  static fromKeyOrThrow(key: string): AudioVoiceType {
    if (key == null || AudioVoiceType[key] == null) {
      throw new InvalidAudioVoiceTypeKeyError();
    }
    return AudioVoiceType[key];
  }

  static fromKey(key: Nullable<string>): Nullable<AudioVoiceType> {
    if (key == null) return null;
    return AudioVoiceType[key];
  }

  static compare(v1: Nullable<AudioVoiceType>, v2: Nullable<AudioVoiceType>) {
    if (v1 == null && v2 != null) return -1;
    if (v1 != null && v2 == null) return 1;
    if (v1?.key == v2?.key) return 0;
    return (v1 as AudioVoiceType).priority - (v2 as AudioVoiceType).priority;
  }
}

export class InvalidAudioVoiceTypeKeyError extends Error {}
