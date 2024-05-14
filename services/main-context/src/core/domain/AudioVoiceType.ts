export const AudioVoiceTypes = {
  DUB: { name : "DUB" },
  MVO: { name : "MVO" },
  DVO: { name : "DVO" },
  SO: { name : "SO" },
  ORIGINAL : { name : "Original" }
} as const;

export class AudioVoiceType {
  readonly code: string;
    
  public constructor(code: string | undefined) {
    if (code == undefined || !(code in AudioVoiceTypes)) {
      throw new InvalidAudioVoiceTypeError();
    }
    this.code = code;
  }
}
  
class InvalidAudioVoiceTypeError extends Error {}
