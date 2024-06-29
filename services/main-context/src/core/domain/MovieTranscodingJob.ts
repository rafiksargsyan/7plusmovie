import { v4 as uuid } from 'uuid';
import { SubtitleType } from './SubtitleType';
import { AudioLang } from './AudioLang';
import { SubsLang } from './SubsLang';
import { Nullable } from '../../utils';

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

export interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: AudioLang;
  name: Nullable<string>;
  fileName: Nullable<string>;
}

export interface TextTranscodeSpec {
  stream: number;
  name: Nullable<string>;
  type: Nullable<SubtitleType>;
  lang: SubsLang;
  fileName: Nullable<string>;
}

export interface VideoTranscodeSpec {
  resolutions: { fileName: string, resolution: number } []; // 360, 480, 720, 1080, etc.
  stream: number;
}

export interface MovieTranscodingJobRead {
  id: string;
  movieId: string;
  mkvS3ObjectKey: Nullable<string>;
  mkvHttpUrl: Nullable<string>;
  outputFolderKey: string;
  audioTranscodeSpecs: AudioTranscodeSpec[];
  textTranscodeSpecs: TextTranscodeSpec[];
  videoTranscodeSpec: VideoTranscodeSpec;
  transcodingContextJobId: Nullable<string>;
  releaseId: string;
  releasesToBeRemoved: string[];
  releaseIndexerContextReleaseId: Nullable<string>;
}

export class MovieTranscodingJob {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private ttl: number;
  private movieId: string;
  private mkvS3ObjectKey: string;
  private mkvHttpUrl: string;
  private outputFolderKey: string;
  private audioTranscodeSpecs: AudioTranscodeSpec[];
  private textTranscodeSpecs: TextTranscodeSpec[];
  private videoTranscodeSpec: VideoTranscodeSpec;
  private transcodingContextJobId: string;
  private releaseId: string;
  private releasesToBeRemoved: string[];
  private releaseIndexerContextReleaseId: string;

  public constructor(createEmptyObject: boolean, movieId?: string, mkvS3ObjectKey?: string,
    mkvHttpUrl?: string, outputFolderKey?: string, audioTranscodeSpecs?: AudioTranscodeSpec[],
    textTranscodeSpecs?: TextTranscodeSpec[], videoTranscodeSpec?: VideoTranscodeSpec, releaseId?: string,
    releasesToBeRemoved?: string[]) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setMovieId(movieId);
      this.setReleaseId(releaseId);
      this.setMkvLocation(mkvHttpUrl, mkvS3ObjectKey);
      if (outputFolderKey == null) outputFolderKey = `${movieId}/${releaseId}`;
      this.setOutputFolderKey(outputFolderKey)
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setVideoTranscodeSpec(videoTranscodeSpec);
      this.setReleasesToBeRemoved(releasesToBeRemoved);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round(this.creationTime / 1000) + 15 * ONE_DAY_IN_SECONDS;
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
    if (audioTranscodeSpecs == null) audioTranscodeSpecs = [];
    for (let a of audioTranscodeSpecs) {
      if (a.fileName == null) {
        a.fileName = `${a.lang.key}-${a.channels}-${a.bitrate}-${a.stream}.mp4`
      }
      if (a.name == null) {
        a.name = `${a.lang.name} (${a.channels})`
      }
    }
    this.audioTranscodeSpecs = audioTranscodeSpecs;
  }

  private setTextTranscodeSpecs(textTranscodeSpecs: Nullable<TextTranscodeSpec[]>) {
    if (textTranscodeSpecs == null) textTranscodeSpecs = [];
    for (let t of textTranscodeSpecs) {
      if (t.fileName == null) {
        if (t.type == null) {
          t.fileName = `${t.lang.key}-${t.stream}.vtt`
        } else {
          t.fileName = `${t.lang.key}-${t.type.key}-${t.stream}.vtt`
        }
      }
      if (t.name == null) {
        if (t.type == null) {
          t.name = `${t.lang.name}`;
        } else {
          t.name = `${t.lang.name} (${t.type.name})`;
        }
      }
    }
    this.textTranscodeSpecs = textTranscodeSpecs;
  }

  public setTranscodingContextJobId(transcodingContextJobId: string) {
    if (transcodingContextJobId == undefined || ! /\S/.test(transcodingContextJobId)) {
      throw new InvalidTranscodingContextJobIdError();
    }
    this.transcodingContextJobId = transcodingContextJobId;
    this.lastUpdateTime = Date.now();
  }

  private setVideoTranscodeSpec(videoTranscodeSpec: Nullable<VideoTranscodeSpec>) {
    if (videoTranscodeSpec == null) {
      throw new NullVideoTranscodeSpecError();
    }
    for (let r of videoTranscodeSpec.resolutions) {
      if (r.fileName == null) r.fileName = `${r.resolution.toString()}.mp4`;
    }
    this.videoTranscodeSpec = videoTranscodeSpec;
  }

  private setReleaseId(releaseId: Nullable<string>) {
    if (releaseId == null || releaseId.trim() === "") {
      throw new EmptyReleaseIdError();
    }
    this.releaseId = releaseId;
  }

  private setReleasesToBeRemoved(releasesToBeRemoved: Nullable<string[]>) {
    if (releasesToBeRemoved == null) releasesToBeRemoved = [];
    this.releasesToBeRemoved = releasesToBeRemoved;
  }
}

export class InvalidMovieIdError extends Error {}

export class InvalidMkvS3ObjectKeyError extends Error {}

export class InvalidTranscodingContextJobIdError extends Error {}

export class InvalidOutputFolderKeyError extends Error {}

export class MultipleMkvLocationsError extends Error {}

export class NoMkvLocationError extends Error {}

export class InvalidMkvHttpUrlError extends Error {}

export class NullVideoTranscodeSpecError extends Error {}

export class EmptyReleaseIdError extends Error {}
