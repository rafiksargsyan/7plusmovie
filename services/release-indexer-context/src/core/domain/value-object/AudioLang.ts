import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "./AudioAuthor";

export class AudioLang {
  static readonly EN = new AudioLang("EN", "en", "en");
  static readonly EN_US = new AudioLang("EN_US","en", "en-US");
  static readonly EN_GB = new AudioLang("EN_GB", "en", "en-GB");
  static readonly EN_AU = new AudioLang("EN_AU", "en", "en-AU");
  static readonly RU = new AudioLang("RU", "ru", "ru");
  static readonly FR = new AudioLang("FR", "fr", "fr");
  static readonly JA = new AudioLang("JA", "ja", "ja");
  static readonly PT = new AudioLang("PT", "pt", "pt");
  static readonly PT_BR = new AudioLang("PT_BR", "pt", "pt-BR");
  static readonly PT_PT = new AudioLang("PT_PT", "pt", "pt-PT");
  static readonly KO = new AudioLang("KO", "ko", "ko");
  static readonly DA = new AudioLang("DA", "da", "da");
  static readonly HI = new AudioLang("HI", "hi", "hi");
  static readonly HI_IN = new AudioLang("HI_IN", "hi", "hi-IN");
  static readonly IT = new AudioLang("IT", "it", "it");
  static readonly RO = new AudioLang("RO", "ro", "ro");
  static readonly RO_RO = new AudioLang("RO_RO", "ro", "ro-RO");
  static readonly FA = new AudioLang("FA", "fa", "fa");
  static readonly FA_IR = new AudioLang("FA_IR", "fa", "fa-IR");
  static readonly SV = new AudioLang("SV", "sv", "sv");
  static readonly SV_SE = new AudioLang("SV_SE", "sv", "sv-SE");
  static readonly PL = new AudioLang("PL", "pl", "pl");
  static readonly PL_PL = new AudioLang("PL_PL", "pl", "pl-PL");
  static readonly ES = new AudioLang("ES", "es", "es");
  static readonly ES_ES = new AudioLang("ES_ES", "es", "es-ES");
  static readonly ES_419 = new AudioLang("ES_419", "es", "es-419");
  static readonly UK = new AudioLang("UK", "uk", "uk");
  static readonly ZH = new AudioLang("ZH", "zh", "zh");
  static readonly DE = new AudioLang("DE", "de", "de");
  static readonly BE = new AudioLang("BE", "be", "be");
  static readonly BG = new AudioLang('BG', 'bg', 'bg');
  static readonly CS = new AudioLang('CS', 'cs', 'cs');
  static readonly ET = new AudioLang('ET', 'et', 'et');
  static readonly FI = new AudioLang('FI', 'fi', 'fi');
  static readonly HR = new AudioLang('HR', 'hr', 'hr');
  static readonly HU = new AudioLang('HU', 'hu', 'hu');
  static readonly HY = new AudioLang('HY', 'hy', 'hy');
  static readonly LT = new AudioLang('LT', 'lt', 'lt');
  static readonly LV = new AudioLang('LV', 'lv', 'lv');
  static readonly MK = new AudioLang('MK', 'mk', 'mk');
  static readonly NB = new AudioLang('NB', 'nb', 'nb');
  static readonly NL = new AudioLang('NL', 'nl', 'nl');
  static readonly SL = new AudioLang('SL', 'sl', 'sl');
  static readonly SK = new AudioLang('SK', 'sk', 'sk');
  static readonly SR = new AudioLang('SR', 'sr', 'sr');

  static readonly audioAuthorPriorityList = {
    "RU" : [ AudioAuthor.JASKIER_18PLUS, AudioAuthor.VIRUSEPROJECT_18PLUS, AudioAuthor.HDREZKA_18PLUS,
      AudioAuthor.JASKIER, AudioAuthor.VIRUSEPROJECT, AudioAuthor.HDREZKA, AudioAuthor.TVSHOWS, AudioAuthor.KINOMANIA, 
      AudioAuthor.IVI,AudioAuthor.KIRILLICA, AudioAuthor.READ_HEAD_SOUND, AudioAuthor.LOSTFILM,
      AudioAuthor.BRAVO_RECORDS_GEORGIA, AudioAuthor.MOVIE_DALEN],
    "UK" : [AudioAuthor.ONE_PLUS_ONE],
    "BE" : [AudioAuthor.KINAKONG]
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
    "uk" : AudioLang.UK,
    "zh" : AudioLang.ZH,
    "de" : AudioLang.DE,
    "be" : AudioLang.BE,
    "bg" : AudioLang.BG,
    "cs" : AudioLang.CS,
    "et" : AudioLang.ET,
    "fi" : AudioLang.FI,
    "hr" : AudioLang.HR,
    "hu" : AudioLang.HU,
    "hy" : AudioLang.HY,
    "lt" : AudioLang.LT,
    "lv" : AudioLang.LV,
    "mk" : AudioLang.MK,
    "nb" : AudioLang.NB,
    "nl" : AudioLang.NL,
    "sl" : AudioLang.SL,
    "sk" : AudioLang.SK,
    "sr" : AudioLang.SR,
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
    "ger" : AudioLang.DE,
    "bel" : AudioLang.BE,
    "bul" : AudioLang.BG,
    "cze" : AudioLang.CS,
    "ces" : AudioLang.CS,
    "est" : AudioLang.ET,
    "fin" : AudioLang.FI,
    "hrv" : AudioLang.HR,
    "hun" : AudioLang.HU,
    "arm" : AudioLang.HY,
    "hye" : AudioLang.HY,
    "lit" : AudioLang.LT,
    "lav" : AudioLang.LV,
    "mac" : AudioLang.MK,
    "mkd" : AudioLang.MK,
    "nob" : AudioLang.NB,
    "nld" : AudioLang.NL,
    "dut" : AudioLang.NL,
    "slv" : AudioLang.SL,
    "slk" : AudioLang.SK,
    "slo" : AudioLang.SK,
    "srp" : AudioLang.SR,
  } as const;

  readonly key: string;
  readonly lang: string;
  readonly langTag: string;

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
    if (langName === "japanese") return AudioLang.JA;
    if (langName === "portuguese (brazil)") return AudioLang.PT_BR;
    if (langName === "spanish (latino)") return AudioLang.ES_419;
    if (langName === "spanish") return AudioLang.ES;
    if (langName === "hindi") return AudioLang.HI;
    return null;
  }

  static equals(al1: Nullable<AudioLang>, al2: Nullable<AudioLang>) {
    return al1?.key == al2?.key;
  }

  static looseEquals(al1: Nullable<AudioLang>, al2: Nullable<AudioLang>) {
    return al1?.lang == al2?.lang;
  }
}

export class InvalidAudioLangKeyError extends Error {}
