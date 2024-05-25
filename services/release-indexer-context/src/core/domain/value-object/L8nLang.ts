import { Nullable } from "../../../Nullable";

export class L8nLang {
  public static readonly EN_US = new L8nLang("EN_US", "en", "en-US");
  public static readonly EN_GB = new L8nLang("EN_GB", "en", "en-GB");
  public static readonly EN_AU = new L8nLang("EN_AU", "en", "en-AU");
  public static readonly RU = new L8nLang("RU", "ru", "ru");

  public readonly key;
  public readonly lang;
  public readonly langTag;

  private constructor(key: string, lang: string, langTag: string) {
    this.key = key;
    this.langTag = langTag;
    this.lang = lang;
  }

  static fromKeyOrThrow(key: Nullable<string>): L8nLang {
    if (key == null || L8nLang[key] == null) {
      throw new InvalidL8nLangKeyError();
    }
    return L8nLang[key];
  }

  static fromKey(key: Nullable<string>): Nullable<L8nLang> {
    if (key == null) return null;
    return L8nLang[key];
  }

}

export class InvalidL8nLangKeyError extends Error {}
