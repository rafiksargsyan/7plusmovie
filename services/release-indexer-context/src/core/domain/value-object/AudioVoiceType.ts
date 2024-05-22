import { Nullable } from "../../../Nullable";

export class AudioVoiceType {
  public static readonly DUB = new AudioVoiceType(3);
  public static readonly MVO = new AudioVoiceType(2);
  public static readonly DVO = new AudioVoiceType(1);
  public static readonly SO = new AudioVoiceType(0);
  public static readonly ORIGINAL = new AudioVoiceType(4);

  private static readonly values = {
    DUB: AudioVoiceType.DUB,
    MVO: AudioVoiceType.MVO,
    DVO: AudioVoiceType.DVO,
    SO: AudioVoiceType.SO,
    ORIGINAL: AudioVoiceType.ORIGINAL
  } as const;

  private readonly priority;

  private constructor(p: number) {
    this.priority = p;
  }

  static from(key: Nullable<string>): AudioVoiceType {
    if (key == null || !(key in this.values)) {
      throw new InvalidAudioVoiceTypeKeyError();
    }
    return this.values[key];
  }

  static compare(v1: Nullable<AudioVoiceType>, v2: Nullable<AudioVoiceType>) {
    if (v1 == null && v2 != null) return -1;
    if (v1 != null && v2 == null) return 1;
    if (v1 == v2) return 0;
    return (v1 as AudioVoiceType).priority < (v2 as AudioVoiceType).priority ? -1 : 1;
  }
}

export class InvalidAudioVoiceTypeKeyError extends Error {}
