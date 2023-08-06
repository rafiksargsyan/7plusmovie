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
  private movieId: string;
  private mkvS3ObjectKey: string;
  private audioTranscodeSpecs: AudioTranscodeSpec[];
  private textTranscodeSpecs: TextTranscodeSpec[];
  private defaultAudioTrack: number | undefined;
  private defaultTextTrack: number | undefined;

  public constructor(createEmptyObject: boolean, movieId: string,
    mkvS3ObjectKey: string, audioTranscodeSpecs: AudioTranscodeSpec[],
    textTranscodeSpecs: TextTranscodeSpec[], defaultAudioTrack: number | undefined,
    defaultTextTrack: number | undefined) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setMovieId(movieId);
      this.setMkvS3ObjectKey(mkvS3ObjectKey);
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setDefaultAudioTrack(defaultAudioTrack);
      this.setDefaultTextTrack(defaultTextTrack);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
    }
  }

  private setMovieId(movieId: string) {
    if (! /\S/.test(movieId)) {
      throw new InvalidMovieIdError();
    }
    this.movieId = movieId;
  }

  private setMkvS3ObjectKey(mkvS3ObjectKey: string) {
    if (! /\S/.test(mkvS3ObjectKey)) {
      throw new InvalidMkvS3ObjectKeyError();
    }
    this.mkvS3ObjectKey = mkvS3ObjectKey;
  }

  private setAudioTranscodeSpecs(audioTranscodeSpecs: AudioTranscodeSpec[]) {
    if (audioTranscodeSpecs == undefined || audioTranscodeSpecs.length == 0) {
      throw new InvalidAudioTranscodeSpecsError();
    }
    this.audioTranscodeSpecs = audioTranscodeSpecs;
  }

  private setTextTranscodeSpecs(textTranscodeSpecs: TextTranscodeSpec[]) {
    if (textTranscodeSpecs == undefined || textTranscodeSpecs.length == 0) {
      throw new InvalidTextTranscodeSpecsError();
    }
    this.textTranscodeSpecs = textTranscodeSpecs;
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
}

class InvalidMovieIdError extends Error {}

class InvalidMkvS3ObjectKeyError extends Error {}

class InvalidAudioTranscodeSpecsError extends Error {}

class InvalidTextTranscodeSpecsError extends Error {}

class InvalidDefaultAudioTrackError extends Error {}

class InvalidDefaultTextTrackError extends Error {}
