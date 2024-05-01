export const SubtitleTypes = {
  FORCED: "FORCED",
  FULL: "FULL",
  SDH: "SDH"
} as const;

export class SubtitleType {
  readonly type: string;
    
  public constructor(type: string | undefined) {
    if (type == undefined || !(type in SubtitleTypes)) {
      throw new InvalidSubtitleTypeError();
    }
    this.type = type;
  }
}
  
class InvalidSubtitleTypeError extends Error {}
