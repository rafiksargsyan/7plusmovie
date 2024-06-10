import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "./AudioAuthor";

export class AudioLang {
  public static readonly EN = new AudioLang("EN", "en", "en");
  public static readonly EN_US = new AudioLang("EN_US","en", "en-US");
  public static readonly EN_GB = new AudioLang("EN_GB", "en", "en-GB");
  public static readonly EN_AU = new AudioLang("EN_AU", "en", "en-AU");
  public static readonly RU = new AudioLang("RU", "ru", "ru");
  public static readonly FR = new AudioLang("FR", "fr", "fr");
  public static readonly JA = new AudioLang("JA", "ja", "ja");
  public static readonly PT = new AudioLang("PT", "pt", "pt");
  public static readonly PT_BR = new AudioLang("PT_BR", "pt", "pt-BR");
  public static readonly PT_PT = new AudioLang("PT_PT", "pt", "pt-PT");
  public static readonly KO = new AudioLang("KO", "ko", "ko");
  public static readonly DA = new AudioLang("DA", "da", "da");
  public static readonly HI = new AudioLang("HI", "hi", "hi");
  public static readonly HI_IN = new AudioLang("HI_IN", "hi", "hi-IN");
  public static readonly IT = new AudioLang("IT", "it", "it");
  public static readonly RO = new AudioLang("RO", "ro", "ro");
  public static readonly RO_RO = new AudioLang("RO_RO", "ro", "ro-RO");
  public static readonly FA = new AudioLang("FA", "fa", "fa");
  public static readonly FA_IR = new AudioLang("FA_IR", "fa", "fa-IR");
  public static readonly SV = new AudioLang("SV", "sv", "sv");
  public static readonly SV_SE = new AudioLang("SV_SE", "sv", "sv-SE");
  public static readonly PL = new AudioLang("PL", "pl", "pl");
  public static readonly PL_PL = new AudioLang("PL_PL", "pl", "pl-PL");
  public static readonly ES = new AudioLang("ES", "es", "es");
  public static readonly ES_ES = new AudioLang("ES_ES", "es", "es-ES");
  public static readonly ES_419 = new AudioLang("ES_419", "es", "es-419");
  public static readonly UK = new AudioLang("UK", "uk", "uk");

  public static readonly audioAuthorPriorityList = {
    "RU" : [AudioAuthor.JASKIER, AudioAuthor.HDREZKA, AudioAuthor.TVSHOWS, AudioAuthor.READ_HEAD_SOUND,
      AudioAuthor.LOSTFILM, AudioAuthor.BRAVO_RECORDS_GEORGIA, AudioAuthor.MOVIE_DALEN]
  }

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
    "uk" : AudioLang.UK
  } as const;
   
  private static readonly FROM_ISO_639_1 = {
    "eng" : AudioLang.EN,
    "rus" : AudioLang.RU,
    "fra" : AudioLang.FR,
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
    "ukr" : AudioLang.UK
  } as const;

  public readonly key: string;
  public readonly lang: string;
  public readonly langTag: string;

  private constructor(key: string, lang: string, langTag: string) {
    this.key = key;
    this.lang = lang;
    this.langTag = langTag;
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
  
  public static fromRadarrLanguage(langName: string) {
    if (langName == null) return null;
    langName = langName.toLowerCase();
    if (langName === "english") return AudioLang.EN;
    if (langName === "portuguese (brazil)") return AudioLang.PT_BR;
    if (langName === "spanish (latino)") return AudioLang.ES_419;
    if (langName === "spanish") return AudioLang.ES;
    if (langName === "hindi") return AudioLang.HI;
    return null;
  }

  static equals(al1: Nullable<AudioLang>, al2: Nullable<AudioLang>) {
    return al1?.key == al2?.key;
  }
}

export class InvalidAudioLangKeyError extends Error {}
