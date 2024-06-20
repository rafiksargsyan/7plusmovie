import { Nullable } from "./Nullable";

export class SubsLang {
  public static readonly EN = new SubsLang("EN", "en", "en", "English");
  public static readonly EN_US = new SubsLang("EN_US", "en", "en-US", "English (US)");
  public static readonly EN_GB = new SubsLang("EN_GB", "en", "en-GB", "English (GB)");
  public static readonly RU = new SubsLang("RU", "ru", "ru", "Russian");
  public static readonly FR = new SubsLang("FR", "fr", "fr", "French");
  public static readonly JA = new SubsLang("JA", "ja", "ja", "Japanese");
  public static readonly PT = new SubsLang("PT", "pt", "pt", "Portuguese");
  public static readonly KO = new SubsLang("KO", "ko", "ko", "Korean");
  public static readonly DA = new SubsLang("DA", "da", "da", "Danish");
  public static readonly HI = new SubsLang("HI", "hi", "hi", "Hindi");
  public static readonly HI_IN = new SubsLang("HI_IN", "hi", "hi-IN", "Hindi (India)");
  public static readonly IT = new SubsLang("IT", "it", "it", "Italian");
  public static readonly RO = new SubsLang("RO", "ro", "ro", "Romanian");
  public static readonly RO_RO = new SubsLang("RO_RO", "ro", "ro-RO", "Romanian (Romania)");
  public static readonly FA = new SubsLang("FA", "fa", "fa", "Farsi");
  public static readonly FA_IR = new SubsLang("FA_IR", "fa", "fa-IR", "Farsi (Iran)");
  public static readonly SV = new SubsLang("SV", "sv", "sv", "Swedish");
  public static readonly SV_SE = new SubsLang("SV_SE", "sv", "sv-SE", "Swedish (Sweden)");
  public static readonly PL = new SubsLang("PL", "pl", "pl", "Polish");
  public static readonly PL_PL = new SubsLang("PL_PL", "pl", "pl-PL", "Polish (Poland)");
  public static readonly ES = new SubsLang("ES", "es", "es", "Spanish");
  public static readonly ES_ES = new SubsLang("ES_ES", "es", "es-ES", "Spanish (Spain)");
  public static readonly ES_419 = new SubsLang("ES_419", "es", "es-419", "Spanish (Latin American)");
  public static readonly UK = new SubsLang("UK", "uk", "uk", "Ukrainian");
  public static readonly ZH = new SubsLang("ZH", "zh", "zh", "Chinese");
  public static readonly DE = new SubsLang("DE", "de", "de", "German");

  private static readonly FROM_ISO_639_2 = {
    "en" : SubsLang.EN,
    "ru" : SubsLang.RU,
    "fr" : SubsLang.FR,
    "ja" : SubsLang.JA,
    "pt" : SubsLang.PT,
    "ko" : SubsLang.KO,
    "da" : SubsLang.DA,
    "hi" : SubsLang.HI,
    "it" : SubsLang.IT,
    "ro" : SubsLang.RO,
    "fa" : SubsLang.FA,
    "sv" : SubsLang.SV,
    "pl" : SubsLang.PL,
    "es" : SubsLang.ES,
    "uk" : SubsLang.UK,
    "zh" : SubsLang.ZH,
    "de" : SubsLang.DE
  } as const;
   
  private static readonly FROM_ISO_639_1 = {
    "eng" : SubsLang.EN,
    "rus" : SubsLang.RU,
    "fra" : SubsLang.FR,
    "fre" : SubsLang.FR,
    "jpn" : SubsLang.JA,
    "por" : SubsLang.PT,
    "kor" : SubsLang.KO,
    "dan" : SubsLang.DA,
    "hin" : SubsLang.HI,
    "ita" : SubsLang.IT,
    "ron" : SubsLang.RO,
    "fas" : SubsLang.FA,
    "swe" : SubsLang.SV,
    "pol" : SubsLang.PL,
    "spa" : SubsLang.ES,
    "ukr" : SubsLang.UK,
    "chi" : SubsLang.ZH,
    "zho" : SubsLang.ZH,
    "ger" : SubsLang.DE
  } as const;

  public readonly key: string;
  public readonly lang: string;
  public readonly langTag: string;
  public readonly name: string;

  private constructor(key: string, lang: string, langTag: string, name: string) {
    this.key = key;
    this.lang = lang;
    this.langTag = langTag;
    this.name = name;
  }

  static fromKeyOrThrow(key: string): SubsLang {
    if (key == null || SubsLang[key] == null) {
      throw new InvalidSubsLangKeyError();
    }
    return SubsLang[key];
  }

  static fromKey(key: Nullable<string>): Nullable<SubsLang> {
    if (key == null) return null;
    return SubsLang[key];
  }

  public static fromISO_639_2(code: Nullable<string>) {
    if (code == null) return null;
    return this.FROM_ISO_639_2[code];
  }

  public static fromISO_639_1(code: Nullable<string>) {
    if (code == null) return null;
    return this.FROM_ISO_639_1[code];
  }

  static equals(sl1: Nullable<SubsLang>, sl2: Nullable<SubsLang>) {
    return sl1?.key == sl2?.key;
  }

  static looseEquals(sl1: Nullable<SubsLang>, sl2: Nullable<SubsLang>) {
    return sl1?.lang == sl2?.lang;
  }
}

export class InvalidSubsLangKeyError extends Error {}
