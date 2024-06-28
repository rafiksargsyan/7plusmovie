import { Nullable } from "../../utils";

export class AudioLang {
  public static readonly EN = new AudioLang("EN", "en", "en", "English");
  public static readonly EN_US = new AudioLang("EN_US", "en", "en-US", "English (US)");
  public static readonly EN_GB = new AudioLang("EN_GB", "en", "en-GB", "English (GB)");
  public static readonly EN_AU = new AudioLang("EN_AU", "en", "en-AU", "English (AU)");
  public static readonly RU = new AudioLang("RU", "ru", "ru", "Russian");
  public static readonly FR = new AudioLang("FR", "fr", "fr", "French");
  public static readonly JA = new AudioLang("JA", "ja", "ja", "Japanese");
  public static readonly PT = new AudioLang("PT", "pt", "pt", "Portuguese");
  public static readonly KO = new AudioLang("KO", "ko", "ko", "Korean");
  public static readonly DA = new AudioLang("DA", "da", "da", "Danish");
  public static readonly HI = new AudioLang("HI", "hi", "hi", "Hindi");
  public static readonly HI_IN = new AudioLang("HI_IN", "hi", "hi-IN", "Hindi (India)");
  public static readonly IT = new AudioLang("IT", "it", "it", "Italian");
  public static readonly RO = new AudioLang("RO", "ro", "ro", "Romanian");
  public static readonly RO_RO = new AudioLang("RO_RO", "ro", "ro-RO", "Romanian (Romania)");
  public static readonly FA = new AudioLang("FA", "fa", "fa", "Farsi");
  public static readonly FA_IR = new AudioLang("FA_IR", "fa", "fa-IR", "Farsi (Iran)");
  public static readonly SV = new AudioLang("SV", "sv", "sv", "Swedish");
  public static readonly SV_SE = new AudioLang("SV_SE", "sv", "sv-SE", "Swedish (Sweden)");
  public static readonly PL = new AudioLang("PL", "pl", "pl", "Polish");
  public static readonly PL_PL = new AudioLang("PL_PL", "pl", "pl-PL", "Polish (Poland)");
  public static readonly ES = new AudioLang("ES", "es", "es", "Spanish");
  public static readonly ES_ES = new AudioLang("ES_ES", "es", "es-ES", "Spanish (Spain)");
  public static readonly ES_419 = new AudioLang("ES_419", "es", "es-419", "Spanish (Latin American)");
  public static readonly UK = new AudioLang("UK", "uk", "uk", "Ukrainian");
  public static readonly ZH = new AudioLang("ZH", "zh", "zh", "Chinese");
  public static readonly DE = new AudioLang("DE", "de", "de", "German");

  private static readonly FROM_ISO_639_2 = {
    "en" : AudioLang.EN,
    "ru" : AudioLang.RU,
    "fr" : AudioLang.FR,
    "ja" : AudioLang.JA,
    "pt" : AudioLang.PT,
    "ko" : AudioLang.KO,
    "da" : AudioLang.DA,
    "hi" : AudioLang.HI,
    "it" : AudioLang.IT,
    "ro" : AudioLang.RO,
    "fa" : AudioLang.FA,
    "sv" : AudioLang.SV,
    "pl" : AudioLang.PL,
    "es" : AudioLang.ES,
    "uk" : AudioLang.UK,
    "zh" : AudioLang.ZH,
    "de" : AudioLang.DE
  } as const;
   
  private static readonly FROM_ISO_639_1 = {
    "eng" : AudioLang.EN,
    "rus" : AudioLang.RU,
    "fra" : AudioLang.FR,
    "fre" : AudioLang.FR,
    "jpn" : AudioLang.JA,
    "por" : AudioLang.PT,
    "kor" : AudioLang.KO,
    "dan" : AudioLang.DA,
    "hin" : AudioLang.HI,
    "ita" : AudioLang.IT,
    "ron" : AudioLang.RO,
    "fas" : AudioLang.FA,
    "swe" : AudioLang.SV,
    "pol" : AudioLang.PL,
    "spa" : AudioLang.ES,
    "ukr" : AudioLang.UK,
    "chi" : AudioLang.ZH,
    "zho" : AudioLang.ZH,
    "ger" : AudioLang.DE
  } as const;

  public readonly key: string;
  public readonly lang: string;
  public readonly langTag: string;
  public readonly name: string

  private constructor(key: string, lang: string, langTag: string, name: string) {
    this.key = key;
    this.lang = lang;
    this.langTag = langTag;
    this.name = name;
  }

  static fromKeyOrThrow(key: string): AudioLang {
    if (key == null || AudioLang[key] == null) {
      throw new InvalidAudioLangKeyError();
    }
    return AudioLang[key];
  }

  static fromKey(key: Nullable<string>): Nullable<AudioLang> {
    if (key == null) return null;
    return AudioLang[key];
  }

  public static fromISO_639_2(code: Nullable<string>) {
    if (code == null) return null;
    return this.FROM_ISO_639_2[code];
  }

  public static fromISO_639_1(code: Nullable<string>) {
    if (code == null) return null;
    return this.FROM_ISO_639_1[code];
  }

  static equals(al1: Nullable<AudioLang>, al2: Nullable<AudioLang>) {
    return al1?.key == al2?.key;
  }

  static looseEquals(al1: Nullable<AudioLang>, al2: Nullable<AudioLang>) {
    return al1?.lang == al2?.lang;
  }
}

export class InvalidAudioLangKeyError extends Error {}
