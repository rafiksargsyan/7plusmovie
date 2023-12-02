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
  private defaultAudioTrack: number | undefined;
  private defaultTextTrack: number | undefined;
  private transcodingContextJobId: string;

  public constructor(createEmptyObject: boolean, tvShowId?: string, season?: number, episode?: number,
    mkvS3ObjectKey?: string, mkvHttpUrl?: string, outputFolderKey?: string, audioTranscodeSpecs?: AudioTranscodeSpec[],
    textTranscodeSpecs?: TextTranscodeSpec[], defaultAudioTrack?: number,
    defaultTextTrack?: number) {
    if (!createEmptyObject) {
      this.id = uuid();
      this.setTvShowId(tvShowId);
      this.setSeason(season);
      this.setEpisode(episode);
      this.setMkvLocation(mkvHttpUrl, mkvS3ObjectKey);
      this.setOutputFolderKey(outputFolderKey)
      this.setAudioTranscodeSpecs(audioTranscodeSpecs);
      this.setTextTranscodeSpecs(textTranscodeSpecs);
      this.setDefaultAudioTrack(defaultAudioTrack);
      this.setDefaultTextTrack(defaultTextTrack);
      this.creationTime = Date.now();
      this.lastUpdateTime = this.creationTime;
      this.ttl = Math.round(this.creationTime / 1000) + 15 * 24 * 60 * 60;
    }
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

  public setTranscodingContextJobId(transcodingContextJobId: string | undefined) {
    if (transcodingContextJobId == undefined || ! /\S/.test(transcodingContextJobId)) {
      throw new InvalidTranscodingContextJobIdError();
    }
    this.transcodingContextJobId = transcodingContextJobId;
    this.lastUpdateTime = Date.now();
  }
}

class InvalidTvShowIdError extends Error {}

class InvalidMkvS3ObjectKeyError extends Error {}

class InvalidDefaultAudioTrackError extends Error {}

class InvalidDefaultTextTrackError extends Error {}

class InvalidTranscodingContextJobIdError extends Error {}

class InvalidOutputFolderKeyError extends Error {}

class InvalidSeasonError extends Error {}

class InvalidEpisodeError extends Error {}

class MultipleMkvLocationsError extends Error {}

class NoMkvLocationError extends Error {}

class InvalidMkvHttpUrlError extends Error {}
