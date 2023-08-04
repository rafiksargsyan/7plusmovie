import { v4 as uuid } from 'uuid';
import { AudioLangCodes } from './AudioLangCodes';
import { SubsLangCodes } from './SubsLangCodes';

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: keyof typeof AudioLangCodes;
}

interface TextTranscodeSpec {
  stream: number;
  forced: boolean;
  lang: keyof typeof SubsLangCodes;
}

export class MovieTranscodingJob {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private readonly movieId: string;
  private readonly mkvS3ObjectKey: string;
  private readonly audioTranscodeSpecs: AudioTranscodeSpec[];
  private readonly textTranscodeSpecs: TextTranscodeSpec[];
  private readonly defaultAudioTrack: number | undefined;
  private readonly defaultTextTrack: number | undefined;

  public constructor(createEmptyObject: boolean, movieId: string,
    mkvS3ObjectKey: string, audioTranscodeSpecs: AudioTranscodeSpec[],
    textTranscodeSpecs: TextTranscodeSpec[], defaultAudioTrack: number | undefined,
    defaultTextTrack: number | undefined) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.movieId = movieId;
      this.mkvS3ObjectKey = mkvS3ObjectKey;
      this.audioTranscodeSpecs = audioTranscodeSpecs;
      this.textTranscodeSpecs = textTranscodeSpecs;
      this.defaultAudioTrack = defaultAudioTrack;
      this.defaultTextTrack = defaultTextTrack;
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
    }
  }
}
