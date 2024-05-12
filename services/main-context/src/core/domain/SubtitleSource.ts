export const SubtitleSources = {
  EXTERNAL: { key : "EXTERNAL" }, // Coming from torrent, usenet releases
  ADMIN: { key : "ADMIN" } // added by admin
} as const;

export class SubtitleSource {
  readonly type: string;
    
  public constructor(type: string | undefined) {
    if (type == undefined || !(type in SubtitleSources)) {
      throw new InvalidSubtitleSourceError();
    }
    this.type = type;
  }
}
  
class InvalidSubtitleSourceError extends Error {}
