import { v4 as uuid } from 'uuid';
import { AudioLangCode } from './AudioLangCodes';
import { SubsLangCode } from './SubsLangCodes';
import { SubtitleType } from './SubtitleType';

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: AudioLangCode;
}

interface TextTranscodeSpec {
  stream: number;
  name: string;
  type: SubtitleType;
  lang: SubsLangCode;
}

export class MovieTranscodingJob {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private ttl: number;
  private movieId: string;
  private mkvS3ObjectKey: string;
  private mkvHttpUrl;
  private outputFolderKey: string;
  private audioTranscodeSpecs: AudioTranscodeSpec[];
  private textTranscodeSpecs: TextTranscodeSpec[];
  private transcodingContextJobId: string;

  public constructor(createEmptyObject: boolean, movieId?: string, mkvS3ObjectKey?: string,
    mkvHttpUrl?: string, outputFolderKey?: string, audioTranscodeSpecs?: AudioTranscodeSpec[],
    textTranscodeSpecs?: TextTranscodeSpec[]) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setMovieId(movieId);
      this.setMkvLocation(mkvHttpUrl, mkvS3ObjectKey);
      this.setOutputFolderKey(outputFolderKey)
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round(this.creationTime / 1000) + 15 * 24 * 60 * 60;
    }
  }

  private setMovieId(movieId: string | undefined) {
    if (movieId == undefined || ! /\S/.test(movieId)) {
      throw new InvalidMovieIdError();
    }
    this.movieId = movieId;
  }

  private setMkvLocation(mkvHttpUrl: string | undefined, mkvS3ObjectKey: string | undefined) {
    if (mkvHttpUrl != undefined && mkvS3ObjectKey != undefined) {
      throw new MultipleMkvLocationsError();
    }
    if (mkvHttpUrl != undefined) {
      if (! /\S/.test(mkvHttpUrl)) {
        throw new InvalidMkvHttpUrlError();
      }
      this.mkvHttpUrl = mkvHttpUrl;
      return;
    }
    if (mkvS3ObjectKey != undefined) {
      if (! /\S/.test(mkvS3ObjectKey)) {
        throw new InvalidMkvS3ObjectKeyError();
      }
      this.mkvS3ObjectKey = mkvS3ObjectKey;
      return;
    }         
    throw new NoMkvLocationError();
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

class MultipleMkvLocationsError extends Error {}

class NoMkvLocationError extends Error {}

class InvalidMkvHttpUrlError extends Error {}
