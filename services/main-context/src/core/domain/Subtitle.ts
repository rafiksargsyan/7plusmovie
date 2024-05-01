import { SubsLangCode } from "./SubsLangCodes";
import { SubtitleSource } from "./SubtitleSource";
import { SubtitleType } from "./SubtitleType";

export class Subtitle {
  private name: string;
  private relativePath: string;
  private lang: SubsLangCode;
  private type: SubtitleType;
  private recommendedDelay: number; // millis, can be negative
  private source: SubtitleSource;
  private audioTrackId: string; // if not null, means text matches speech in the audio track  
}