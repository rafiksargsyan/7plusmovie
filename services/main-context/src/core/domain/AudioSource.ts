export const AudioSources = {
  EXTERNAL: { key : "EXTERNAL" }, // Coming from torrent, usenet releases
  ADMIN: { key : "ADMIN" } // added by admin
} as const;

export class AudioSource {
  readonly type: string;
    
  public constructor(type: string | undefined) {
    if (type == undefined || !(type in AudioSources)) {
      throw new InvalidAudioSourceError();
    }
    this.type = type;
  }
}
  
class InvalidAudioSourceError extends Error {}
