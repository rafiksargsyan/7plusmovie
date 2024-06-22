import { Nullable, strIsBlank } from "../../../utils";
import { AudioLang } from "../AudioLang";
import { MediaSource } from "../MediaSource";
import { SubsLang } from "../SubsLang";
import { SubtitleType } from "../SubtitleType";

export interface Release {
  subtitles: { [key: string]: Subtitle }; // key will also match with labael in MPD/HlS manifest if subs come from the package
  audios: { [key: string]: Audio }; // key will also match with label in MPD or HlS manifest
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile: string;
  // This is the id in the release indexer context, if a release is replaced with
  // a better release in the context we will replace it also in the main context.
  releaseIndexerContextId: string | undefined;
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

  public static create(name: string, relativePath: string, lang: AudioLang, channels: number,
                       source: MediaSource) {
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
