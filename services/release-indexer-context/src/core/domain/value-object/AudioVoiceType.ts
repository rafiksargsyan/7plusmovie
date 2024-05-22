import { Nullable } from "../../../Nullable";

export class AudioVoiceType {
    public static readonly DUB = new AudioVoiceType();
    public static readonly MVO = new AudioVoiceType();
    public static readonly DVO = new AudioVoiceType();
    public static readonly SO = new AudioVoiceType();
    public static readonly ORIGINAL = new AudioVoiceType();   
 
    private static readonly values = {
      DUB: AudioVoiceType.DUB,
      MVO: AudioVoiceType.MVO,
      DVO: AudioVoiceType.DVO,
      SO: AudioVoiceType.SO,
      ORIGINAL: AudioVoiceType.ORIGINAL
    } as const;
  
    static from(key: Nullable<string>): AudioVoiceType {
      if (key == null || !(key in this.values)) {
        throw new InvalidAudioVoiceTypeKeyError();
      }
      return this.values[key];
    }
}

export class InvalidAudioVoiceTypeKeyError extends Error {}
