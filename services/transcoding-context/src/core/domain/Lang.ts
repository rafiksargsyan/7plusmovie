import { Nullable } from "./Nullable";

export class Lang {
  public static readonly EN = new Lang("EN", "en");
  public static readonly RU = new Lang("RU", "ru");
  public static readonly FR = new Lang("FR", "fr");
  public static readonly JA = new Lang("JA", "ja");
  public static readonly PT = new Lang("PT", "pt");
  public static readonly KO = new Lang("KO", "ko");
  public static readonly DA = new Lang("DA", "da");
  public static readonly HI = new Lang("HI", "hi");
  public static readonly IT = new Lang("IT", "it");
  public static readonly RO = new Lang("RO", "ro");
  public static readonly FA = new Lang("FA", "fa");
  public static readonly SV = new Lang("SV", "sv");
  public static readonly PL = new Lang("PL", "pl");
  public static readonly ES = new Lang("ES", "es");
  public static readonly UK = new Lang("UK", "uk");
  public static readonly ZH = new Lang("ZH", "zh");
  public static readonly DE = new Lang("DE", "de");

  public readonly key: string;
  public readonly lang: string;

  private constructor(key: string, lang: string) {
    this.key = key;
    this.lang = lang;
  }

  static fromKeyOrThrow(key: string): Lang {
    if (key == null || Lang[key] == null) {
      throw new InvalidLangKeyError();
    }
    return Lang[key];
  }

  static fromKey(key: Nullable<string>): Nullable<Lang> {
    if (key == null) return null;
    return Lang[key];
  }

}

export class InvalidLangKeyError extends Error {}
