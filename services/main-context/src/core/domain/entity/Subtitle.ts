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
  
  public constructor(name: Nullable<string>, relativePath: string,
                     lang: SubsLang, type: Nullable<SubtitleType>) {
    this.type = type;
    this.lang = this.validateLang(lang);
    this.relativePath = this.validateRelativePath(relativePath);
    if (name == null) {
      if (this.type != null) {
        name = `${lang.name} (${this.type.name}})`;
      } else {
        name = `${lang.name}`;
      }
    }
    this.name = this.validateName(name);
  }

  public getName() {
    return this.name;
  }

  private validateLang(lang: SubsLang) {
    if (lang == null) {
      throw new InvalidSubtitleLangError();
    }
    return lang;
  }

  private validateRelativePath(path: string) {
    if (path == null || ! /\S/.test(path)) {
      throw new InvalidSubtitleRelativePathError();
    }
    return path;
  }

  private validateName(name: string) {
    if (name == null || ! /\S/.test(name)) {
      throw new InvalidSubtitleNameError();
    }
    return name;
  }
}

class InvalidSubtitleLangError extends Error {}

class InvalidSubtitleRelativePathError extends Error {}

class InvalidSubtitleNameError extends Error {}
