import { Nullable, strIsBlank } from "../../../utils";
import { AudioLang } from "../AudioLang";
import { MediaSource } from "../MediaSource";
import { SubsLang } from "../SubsLang";
import { SubtitleType } from "../SubtitleType";
import { Resolution as ResolutionEnum } from "../Resolution";
import { RipType } from "../RipType";

export interface ReleaseRead {
  _subtitles: { [key: string]: SubtitleRead };
  _audios: { [key: string]: AudioRead };
  _video: VideoRead;
  _mpdFile: string;
  _m3u8File: string;
  _thumbnailsFile: string;
  _thumbnails: { resolution: number, thumbnailsFile: string } [];
  _releaseIndexerContextId: Nullable<string>;
  _rootFolder: string;
}

export interface Thumbnail {
  resolution: number;
  thumbnailsFile: string;
}

export class Release {
  private _subtitles: { [key: string]: Subtitle }; // key will also match with labael in MPD/HlS manifest if subs come from the package
  private _audios: { [key: string]: Audio }; // key will also match with label in MPD or HlS manifest
  private _video: Video;
  private _mpdFile: string;
  private _m3u8File: string;
  private _thumbnailsFile: string;
  private _thumbnails: Thumbnail[];
  // This is the id in the release indexer context, if a release is replaced with
  // a better release in the context we will replace it also in the main context.
  private _releaseIndexerContextId: Nullable<string>;
  private _rootFolder: string;
  private _ripType: Nullable<RipType>;
  private _resolution: ResolutionEnum;

  private constructor(createEmptyObject: boolean, subtitles?: { [key: string]: Subtitle }, audios?: { [key: string]: Audio },
                      video?: Video, mpdFile?: string, m3u8File?: string, releaseIndexerContextId?: Nullable<string>,
                      rootFolder?: string, ripType?: Nullable<RipType>, resolution?: Nullable<ResolutionEnum>, thumbnails?: Thumbnail[]) {
    if (!createEmptyObject) {
      if (subtitles == null) subtitles = {};
      this._subtitles = subtitles;
      this._audios = this.validateAudios(audios);
      this._video = this.validateVideo(video);
      this._mpdFile = this.validateMpdFile(mpdFile);
      this._m3u8File = this.validateM3U8File(m3u8File);
      this._releaseIndexerContextId = releaseIndexerContextId;
      this._rootFolder = this.validateRootFolder(rootFolder);
      this._resolution = this.validateResolution(resolution);
      this._ripType = ripType;
      this._thumbnails = this.validateThumbnails(thumbnails);
    }
  }
 
  private validateResolution(resolution?: Nullable<ResolutionEnum>) {
    if (resolution == null) {
      throw new NullResolutionError();
    }
    return resolution;
  }

  private validateRootFolder(rootFolder?: string) {
    if (strIsBlank(rootFolder)) {
      throw new BlankRootFolderError();
    }
    return rootFolder!;
  }

  private validateAudios(audios?: { [key: string]: Audio }) {
    if (audios == null || Object.entries(audios).length === 0) {
      throw new EmptyAudiosError();
    }
    return audios;
  }

  private validateVideo(video?: Video) {
    if (video == null) {
      throw new NullVideoError();
    }
    return video;
  }

  private validateMpdFile(mpdFile?: string) {
    if (mpdFile == null || mpdFile.trim() == "") {
      throw new NullMpdFileError();
    }
    return mpdFile;
  }

  private validateM3U8File(m3u8File?: string) {
    if (m3u8File == null || m3u8File.trim() == "") {
      throw new NullM3U8FileError();
    }
    return m3u8File;
  }

  private validateThumbnails(thumbnails?: Thumbnail[]) {
    if (thumbnails == null || thumbnails.length === 0) {
      throw new EmptyThumbnailsError();
    }
    return thumbnails;
  }

  public static createEmpty() {
    return new Release(true);
  }

  public static create(subtitles: { [key: string]: Subtitle }, audios: { [key: string]: Audio }, video: Video,
                       mpdFile: string, m3u8File: string, releaseIndexerContextId: Nullable<string>,
                       rootFolder: string, ripType: Nullable<RipType>, resolution: Nullable<ResolutionEnum>, thumbnails: Thumbnail[]) {
    return new Release(false, subtitles, audios, video, mpdFile, m3u8File, releaseIndexerContextId, rootFolder, ripType, resolution, thumbnails);
  }

  public get rootFolder() {
    return this._rootFolder;
  }
}

export type Resolution = { resolution: number, size: Nullable<number>, relativePath: string };

export interface VideoRead {
  resolutions: Resolution[];
}

export class Video {
  private resolutions: Resolution[];

  private constructor(createEmptyObject: boolean, resolutions?: Resolution[]) {
    if (!createEmptyObject) {
      this.resolutions = this.validateResolutions(resolutions);
    }
  }

  private validateResolutions(resolutions?: Resolution[]) {
    if (resolutions == null) {
      throw new NullVideoResolutionsError();
    }
    return resolutions;
  }

  public static createEmpty() {
    return new Video(true);
  }

  public static create(resolutions: Resolution[]) {
    return new Video(false, resolutions);
  }
}

export interface AudioRead {
  name: string;
  relativePath: string;
  lang: AudioLang;
  channels: number;
  source: MediaSource;
}

export class Audio {
  private name: string;
  private relativePath: string;
  private lang: AudioLang;
  private channels: number;
  private source: MediaSource = MediaSource.EXTERNAL;

  private constructor(createEmptyObject: boolean, name?: string, relativePath?: string,
                      lang?: AudioLang, channels?: number) {
    if (!createEmptyObject) {
      this.name = this.validateName(name);
      this.relativePath = this.validateRelativePath(relativePath);
      this.channels = this.validateChannels(channels);
      this.lang = this.validateLang(lang);
    }
  }

  public static creatEmpty() {
    return new Audio(true);
  }

  public static create(name: string, relativePath: string, lang: AudioLang, channels: number) {
    return new Audio(false, name, relativePath, lang, channels);
  }

  private validateName(name?: string) {
    if (strIsBlank(name)) {
      throw new BlankAudioNameError();
    }
    return name!;
  }

  private validateRelativePath(path?: string) {
    if (strIsBlank(path)) {
      throw new BlankAudioRelativePathError();
    }
    return path!;
  }

  private validateChannels(channels?: number) {
    if (channels == null) {
      throw new NullAudioChannelsError();
    }
    return channels;
  }

  private validateLang(lang?: AudioLang) {
    if (lang == null) {
      throw new NullAudioLangError();
    }
    return lang;
  }
}

export interface SubtitleRead {
  name: string;
  relativePath: string;
  lang: SubsLang;
  type: Nullable<SubtitleType>;
  recommendedDelay: number;
  source: MediaSource;
  audioTrackId: Nullable<string>;
}

export class Subtitle {
  private name: string;
  private relativePath: string;
  private lang: SubsLang;
  private type: Nullable<SubtitleType>;
  private recommendedDelay: number = 0; // millis, can be negative
  private source: MediaSource = MediaSource.EXTERNAL;
  private audioTrackId: Nullable<string>; // if not null, means text matches speech in the audio track  
  
  private constructor(createEmptyObject: boolean, name?: string, relativePath?: string,
                      lang?: SubsLang, type?: Nullable<SubtitleType>) {
    if (!createEmptyObject) {
      this.type = type;
      this.lang = this.validateLang(lang);
      this.relativePath = this.validateRelativePath(relativePath);
      this.name = this.validateName(name);
    }
  }

  public static createEmpty() {
    return new Subtitle(true);
  }

  public static create(name: string, relativePath: string, lang: SubsLang, type: Nullable<SubtitleType>) {
    return new Subtitle(false, name, relativePath, lang, type);
  }

  private validateLang(lang?: SubsLang) {
    if (lang == null) {
      throw new NullSubtitleLangError();
    }
    return lang;
  }

  private validateRelativePath(path?: string) {
    if (strIsBlank(path)) {
      throw new BlankSubtitleRelativePathError();
    }
    return path!;
  }

  private validateName(name?: string) {
    if (strIsBlank(name)) {
      throw new BlankSubtitleNameError();
    }
    return name!;
  }
}

export class NullSubtitleLangError extends Error {}

export class BlankSubtitleRelativePathError extends Error {}

export class BlankSubtitleNameError extends Error {}

export class BlankAudioNameError extends Error {}

export class BlankAudioRelativePathError extends Error {}

export class NullAudioChannelsError extends Error {}

export class NullAudioLangError extends Error {}

export class NullVideoResolutionsError extends Error {}

export class EmptyAudiosError extends Error {}

export class NullVideoError extends Error {}

export class NullMpdFileError extends Error {}

export class NullM3U8FileError extends Error {}

export class EmptyThumbnailsError extends Error {}

export class BlankRootFolderError extends Error {}

export class NullRipTypeError extends Error {}

export class NullResolutionError extends Error {}
