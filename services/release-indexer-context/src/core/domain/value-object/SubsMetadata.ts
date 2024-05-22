import { SubsAuthor } from "./SubsAuthor";
import { SubsLang } from "./SubsLang";
import { SubsType } from "./SubsType";

export class SubsMetadata {
  public readonly stream: number;
  public readonly lang: SubsLang;
  public readonly type: SubsType;
  public readonly author: SubsAuthor;
}