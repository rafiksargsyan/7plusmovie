import { SubsLang } from "../SubsLang";
import { MediaSource } from "../MediaSource";
import { SubtitleType } from "../SubtitleType";
import { Nullable } from "../Nullable";

export class Subtitle {
  private name: string;
  private relativePath: string;
  private lang: SubsLang;
  private type: Nullable<SubtitleType>;
  private recommendedDelay: number = 0; // millis, can be negative
  private source: MediaSource = MediaSource.fromKeyOrThrow('EXTERNAL');
  private audioTrackId: Nullable<string>; // if not undefined/null, means text matches speech in the audio track  
  
  public constructor(name: string | undefined, relativePath: string | undefined,
                     lang: SubsLangCode | undefined, type: SubtitleType | undefined) {
    this.type = type;
    this.lang = this.validateLang(lang);
    this.relativePath = this.validateRelativePath(relativePath);
    if (name == undefined) {
      if (this.type != null) {
        name = `${SubsLangCodes[this.lang.code].name} (${SubtitleTypes[this.type.code].name})`;
      } else {
        name = `${SubsLangCodes[this.lang.code].name}`;
      }
    }
    this.name = this.validateName(name);
  }

  public getName() {
    return this.name;
  }

  private validateLang(lang: SubsLangCode | undefined) {
    if (lang == undefined) {
      throw new InvalidSubtitleLangError();
    }
    return lang;
  }

  private validateRelativePath(path: string | undefined) {
    if (path == undefined || ! /\S/.test(path)) {
      throw new InvalidSubtitleRelativePathError();
    }
    return path;
  }

  private validateName(name: string | undefined) {
    if (name == undefined || ! /\S/.test(name)) {
      throw new InvalidSubtitleNameError();
    }
    return name;
  }
}

class InvalidSubtitleTypeError extends Error {}

class InvalidSubtitleLangError extends Error {}

class InvalidSubtitleRelativePathError extends Error {}

class InvalidSubtitleNameError extends Error {}
