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

export class TranscodingJob {
  public readonly id: string;
  private githubWorkflowRunId: number;
  private creationTime: number;
  private lastUpdateTime: number;
  private ttl: number;
  private mkvS3ObjectKey: string;
  private mkvHttpUrl: string;
  private outputFolderKey: string;
  private audioTranscodeSpecs: AudioTranscodeSpec[];
  private textTranscodeSpecs: TextTranscodeSpec[];
  private defaultAudioTrack: number | undefined;
  private defaultTextTrack: number | undefined;

  public constructor(createEmptyObject: boolean, mkvS3ObjectKey?: string, mkvHttpUrl?: string, outputFolderKey?: string,
    audioTranscodeSpecs?: AudioTranscodeSpec[], textTranscodeSpecs?: TextTranscodeSpec[], defaultAudioTrack?: number,
    defaultTextTrack?: number) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setMkvLocation(mkvHttpUrl, mkvS3ObjectKey);
      this.setOutputFolderKey(outputFolderKey);
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setDefaultAudioTrack(defaultAudioTrack);
      this.setDefaultTextTrack(defaultTextTrack);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round((this.creationTime / 1000)) + 15 * 24 * 60 * 60;
    }
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
    if (audioTranscodeSpecs == undefined) audioTranscodeSpecs = [];
    this.audioTranscodeSpecs = audioTranscodeSpecs;
  }

  private setTextTranscodeSpecs(textTranscodeSpecs: TextTranscodeSpec[] | undefined) {
    if (textTranscodeSpecs == undefined) textTranscodeSpecs = [];
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

  public setGithubWorkflowRunId(githubWorkflowRunId: number | undefined) {
    if (githubWorkflowRunId == undefined) {
      throw new InvalidGithubWorkflowRunIdError();
    }
    this.githubWorkflowRunId = githubWorkflowRunId;
    this.lastUpdateTime = Date.now();
  }
}

class InvalidMkvS3ObjectKeyError extends Error {}

class InvalidAudioTranscodeSpecsError extends Error {}

class InvalidTextTranscodeSpecsError extends Error {}

class InvalidDefaultAudioTrackError extends Error {}

class InvalidDefaultTextTrackError extends Error {}

class InvalidOutputFolderKeyError extends Error {}

class InvalidGithubWorkflowRunIdError extends Error {}

class MultipleMkvLocationsError extends Error {}

class NoMkvLocationError extends Error {}

class InvalidMkvHttpUrlError extends Error {}
