import { v4 as uuid } from 'uuid';
import { Lang } from './Lang';
import { Nullable } from './Nullable';

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: Lang;
  fileName: string;
  name: string;
}

interface TextTranscodeSpec {
  stream: number;
  name: string;
  fileName: string;
  lang: Lang;
}

interface VideoTranscodeSpec {
  resolutions: { fileName: string, resolution: number } []; // 360, 480, 720, 1080, etc.
  stream: number;
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
  private videoTranscodeSpec: VideoTranscodeSpec;
  private thumbnailResolutions: number[];

  public constructor(createEmptyObject: boolean, mkvS3ObjectKey?: string, mkvHttpUrl?: string, outputFolderKey?: string,
    audioTranscodeSpecs?: AudioTranscodeSpec[], textTranscodeSpecs?: TextTranscodeSpec[], videTranscodeSpec?: VideoTranscodeSpec,
    thumbnailResolutions?: number[]) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setMkvLocation(mkvHttpUrl, mkvS3ObjectKey);
      this.setOutputFolderKey(outputFolderKey);
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setVideoTranscodeSpec(videTranscodeSpec);
      this.setThumbnailResolutions(thumbnailResolutions);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round((this.creationTime / 1000)) + 15 * 24 * 60 * 60;
    }
  }

  private setThumbnailResolutions(thumbnailResolutions?: number[]) {
    if (thumbnailResolutions == null || thumbnailResolutions.length === 0) {
      throw new EmptyThumbnailResolutionsError();
    }
    this.thumbnailResolutions = thumbnailResolutions;
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

  private setVideoTranscodeSpec(videoTranscodeSpec: Nullable<VideoTranscodeSpec>) {
    if (videoTranscodeSpec == null) {
      throw new NullVideoTranscodeSpecError();
    }
    this.videoTranscodeSpec = videoTranscodeSpec;
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

class InvalidOutputFolderKeyError extends Error {}

class InvalidGithubWorkflowRunIdError extends Error {}

class MultipleMkvLocationsError extends Error {}

class NoMkvLocationError extends Error {}

class InvalidMkvHttpUrlError extends Error {}

class NullVideoTranscodeSpecError extends Error {}

class EmptyThumbnailResolutionsError extends Error {}
