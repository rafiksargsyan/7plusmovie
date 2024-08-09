import { v4 as uuid } from 'uuid';
import { AudioTranscodeSpec, TextTranscodeSpec, VideoTranscodeSpec } from './MovieTranscodingJob';
import { Nullable } from '../../utils';
import { RipType } from './RipType';
import { Resolution } from './Resolution';

export interface TvShowTranscodingJobRead {
  id: string;
  tvShowId: string;
  season: number;
  episode: number;
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
  ripType: Nullable<RipType>;
  resolution: Nullable<Resolution>;
  thumbnailResolutions: number[];
}

export class TvShowTranscodingJob {
  public readonly id: string;
  private creationTime: number;
  private lastUpdateTime: number;
  private ttl: number;
  private tvShowId: string;
  private season: number;
  private episode: number;
  private mkvS3ObjectKey: string;
  private mkvHttpUrl: string;
  private outputFolderKey: string;
  private audioTranscodeSpecs: AudioTranscodeSpec[];
  private textTranscodeSpecs: TextTranscodeSpec[];
  private videoTranscodeSpec: VideoTranscodeSpec;
  private transcodingContextJobId: string;
  private releaseId: string;
  private releasesToBeRemoved: string[];
  private releaseIndexerContextReleaseId: Nullable<string>;
  private ripType: RipType;
  private resolution: Resolution;
  private thumbnailResolutions: number[];

  public constructor(createEmptyObject: boolean, tvShowId?: string, season?: number, episode?: number,
    mkvS3ObjectKey?: string, mkvHttpUrl?: string, outputFolderKey?: string, audioTranscodeSpecs?: AudioTranscodeSpec[],
    textTranscodeSpecs?: TextTranscodeSpec[], videoTranscodeSpec?: VideoTranscodeSpec,  releaseId?: string,
    releasesToBeRemoved?: string[], ripType?: Nullable<RipType>, resolution?: Nullable<Resolution>, thumbnailResolutions?: number[],
    ricReleaseId?: Nullable<string>) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setTvShowId(tvShowId);
      this.setSeason(season);
      this.setEpisode(episode);
      this.setReleaseId(releaseId);
      if (outputFolderKey == null) outputFolderKey = `${tvShowId}/${season}/${episode}/${releaseId}`;
      this.setMkvLocation(mkvHttpUrl, mkvS3ObjectKey);
      this.setOutputFolderKey(outputFolderKey)
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setVideoTranscodeSpec(videoTranscodeSpec);
      this.setReleasesToBeRemoved(releasesToBeRemoved);
      this.setThumbnailResolutions(thumbnailResolutions);
      this.releaseIndexerContextReleaseId = ricReleaseId
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round(this.creationTime / 1000) + 15 * 24 * 60 * 60;
    }
  }

  private setThumbnailResolutions(thumbnailResolutions?: number[]) {
    if (thumbnailResolutions == null || thumbnailResolutions.length === 0) {
      throw new EmptyThumbnailResolutionsError();
    }
    this.thumbnailResolutions = thumbnailResolutions;
  }

  private setTvShowId(tvShowId: string | undefined) {
    if (tvShowId == undefined || ! /\S/.test(tvShowId)) {
      throw new InvalidTvShowIdError();
    }
    this.tvShowId = tvShowId;
  }

  private setSeason(season: number | undefined) {
    if (season == undefined || season < 0) {
      throw new InvalidSeasonError();
    }
    this.season = season;
  }

  private setEpisode(episode: number | undefined) {
    if (episode == undefined || episode < 0) {
      throw new InvalidEpisodeError();
    }
    this.episode = episode;
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

  public setTranscodingContextJobId(transcodingContextJobId: string | undefined) {
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

export class InvalidTvShowIdError extends Error {}

export class InvalidMkvS3ObjectKeyError extends Error {}

export class InvalidTranscodingContextJobIdError extends Error {}

export class InvalidOutputFolderKeyError extends Error {}

export class InvalidSeasonError extends Error {}

export class InvalidEpisodeError extends Error {}

export class MultipleMkvLocationsError extends Error {}

export class NoMkvLocationError extends Error {}

export class InvalidMkvHttpUrlError extends Error {}

export class NullVideoTranscodeSpecError extends Error {}

export class EmptyReleaseIdError extends Error {}

export class EmptyThumbnailResolutionsError extends Error {}
