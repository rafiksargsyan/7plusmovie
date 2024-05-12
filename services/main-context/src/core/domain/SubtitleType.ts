export const SubtitleTypes = {
  FORCED: { name : "Forced" },
  FULL: { name : "Full" },
  SDH: { name : "SDH" }
} as const;

export class SubtitleType {
  readonly code: string;
    
  public constructor(code: string | undefined) {
    if (code == undefined || !(code in SubtitleTypes)) {
      throw new InvalidSubtitleTypeError();
    }
    this.code = code;
  }
}
  
class InvalidSubtitleTypeError extends Error {}
