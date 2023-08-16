import { v4 as uuid } from 'uuid';
import { AudioLangCode } from './AudioLangCodes';
import { SubsLangCode } from './SubsLangCodes';

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: AudioLangCode;
}

interface TextTranscodeSpec {
  stream: number;
  forced: boolean;
  lang: SubsLangCode;
}

export class MovieTranscodingJob {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private ttl: number;
  private movieId: string;
  private mkvS3ObjectKey: string;
  private outputFolderKey: string;
  private audioTranscodeSpecs: AudioTranscodeSpec[];
  private textTranscodeSpecs: TextTranscodeSpec[];
  private defaultAudioTrack: number | undefined;
  private defaultTextTrack: number | undefined;
  private transcodingContextJobId: string;

  public constructor(createEmptyObject: boolean, movieId?: string,
    mkvS3ObjectKey?: string, outputFolderKey?: string, audioTranscodeSpecs?: AudioTranscodeSpec[],
    textTranscodeSpecs?: TextTranscodeSpec[], defaultAudioTrack?: number,
    defaultTextTrack?: number) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setMovieId(movieId);
      this.setMkvS3ObjectKey(mkvS3ObjectKey);
      this.setOutputFolderKey(outputFolderKey)
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setDefaultAudioTrack(defaultAudioTrack);
      this.setDefaultTextTrack(defaultTextTrack);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round(this.creationTime / 1000) + 5 * 24 * 60 * 60;
    }
  }

  private setMovieId(movieId: string | undefined) {
    if (movieId == undefined || ! /\S/.test(movieId)) {
      throw new InvalidMovieIdError();
    }
    this.movieId = movieId;
  }

  private setMkvS3ObjectKey(mkvS3ObjectKey: string | undefined) {
    if (mkvS3ObjectKey == undefined || ! /\S/.test(mkvS3ObjectKey)) {
      throw new InvalidMkvS3ObjectKeyError();
    }
    this.mkvS3ObjectKey = mkvS3ObjectKey;
  }

  private setOutputFolderKey(outputFolderKey: string | undefined) {
    if (outputFolderKey == undefined || ! /\S/.test(outputFolderKey)) {
      throw new InvalidOutputFolderKeyError();
    }
    this.outputFolderKey = outputFolderKey;
  }

  private setAudioTranscodeSpecs(audioTranscodeSpecs: AudioTranscodeSpec[] | undefined) {
    this.audioTranscodeSpecs = audioTranscodeSpecs !== undefined ? audioTranscodeSpecs : [];
  }

  private setTextTranscodeSpecs(textTranscodeSpecs: TextTranscodeSpec[] | undefined) {
    this.textTranscodeSpecs = textTranscodeSpecs !== undefined ? textTranscodeSpecs : [];
  }

  private setDefaultAudioTrack(defaultAudioTrack: number | undefined) {
    if (defaultAudioTrack != undefined && (defaultAudioTrack < 0 || defaultAudioTrack >= this.audioTranscodeSpecs.length)) {
      throw new InvalidDefaultAudioTrackError(); 
    }
    this.defaultAudioTrack = defaultAudioTrack;
  }  

  private setDefaultTextTrack(defaultTextTrack: number | undefined) {
    if (defaultTextTrack != undefined && (defaultTextTrack < 0 || defaultTextTrack >= this.textTranscodeSpecs.length)) {
      throw new InvalidDefaultTextTrackError(); 
    }
    this.defaultTextTrack = defaultTextTrack;
  }

  public setTranscodingContextJobId(transcodingContextJobId: string) {
    if (transcodingContextJobId == undefined || ! /\S/.test(transcodingContextJobId)) {
      throw new InvalidTranscodingContextJobIdError();
    }
    this.transcodingContextJobId = transcodingContextJobId;
    this.lastUpdateTime = Date.now();
  }
}

class InvalidMovieIdError extends Error {}

class InvalidMkvS3ObjectKeyError extends Error {}

class InvalidDefaultAudioTrackError extends Error {}

class InvalidDefaultTextTrackError extends Error {}

class InvalidTranscodingContextJobIdError extends Error {}

class InvalidOutputFolderKeyError extends Error {}
