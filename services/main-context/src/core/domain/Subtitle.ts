import { SubsLangCode, SubsLangCodes } from "./SubsLangCodes";
import { SubtitleSource } from "./SubtitleSource";
import { SubtitleType, SubtitleTypes } from "./SubtitleType";

export class Subtitle {
  private name: string;
  private relativePath: string;
  private lang: SubsLangCode;
  private type: SubtitleType;
  private recommendedDelay: number = 0; // millis, can be negative
  private source: SubtitleSource = new SubtitleSource('EXTERNAL');
  private audioTrackId: string | undefined = undefined; // if not undefined/null, means text matches speech in the audio track  
  
  public constructor(name: string | undefined, relativePath: string | undefined,
                     lang: SubsLangCode | undefined, type: SubtitleType | undefined) {
    this.type = this.validateType(type);
    this.lang = this.validateLang(lang);
    this.relativePath = this.validateRelativePath(relativePath);
    if (name == undefined) {
      name = `${SubsLangCodes[this.lang.code].name} (${SubtitleTypes[this.type.code].name})`;  
    }
    this.name = this.validateName(name);
  }

  public getName() {
    return this.name;
  }

  private validateType(type: SubtitleType | undefined) {
    if (type == undefined) {
      throw new InvalidSubtitleTypeError();
    }
    return type;
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
