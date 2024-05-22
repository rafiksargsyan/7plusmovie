import { Nullable } from "../../../Nullable";
import { SubsAuthor } from "./SubsAuthor";
import { SubsLang } from "./SubsLang";
import { SubsType } from "./SubsType";

export class SubsMetadata {
  public readonly stream: number;
  public readonly lang: SubsLang;
  public readonly type: SubsType;
  public readonly author: Nullable<SubsAuthor>;

  public constructor(stream: Nullable<number>, lang: Nullable<SubsLang>, type: Nullable<SubsType>,
                     author: Nullable<SubsAuthor>) {
    this.stream = this.validateStream(stream);
    this.lang = this.validateLang(lang);
    if (type == null) type = SubsType.FULL;
    this.type = type;
    this.author = author;
  }

  private validateStream(stream: Nullable<number>) {
    if (stream == null) throw new NullSubsStreamError();
    return stream;
  }

  private validateLang(lang: Nullable<SubsLang>) {
    if (lang == null) throw new NullSubsLangError();
    return lang;
  }
}

export class NullSubsStreamError extends Error {}

export class NullSubsLangError extends Error {}
