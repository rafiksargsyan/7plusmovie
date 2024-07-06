import { Nullable } from "../../../Nullable";
import { SubsAuthor } from "./SubsAuthor";

export class SubsLang {
  static readonly EN = new SubsLang("EN", "en", "en");
  static readonly EN_US = new SubsLang("EN_US", "en", "en-US");
  static readonly EN_GB = new SubsLang("EN_GB", "en", "en-GB");
  static readonly RU = new SubsLang("RU", "ru", "ru");
  static readonly FR = new SubsLang("FR", "fr", "fr");
  static readonly JA = new SubsLang("JA", "ja", "ja");
  static readonly PT = new SubsLang("PT", "pt", "pt");
  static readonly KO = new SubsLang("KO", "ko", "ko");
  static readonly DA = new SubsLang("DA", "da", "da");
  static readonly HI = new SubsLang("HI", "hi", "hi");
  static readonly HI_IN = new SubsLang("HI_IN", "hi", "hi-IN");
  static readonly IT = new SubsLang("IT", "it", "it");
  static readonly RO = new SubsLang("RO", "ro", "ro");
  static readonly RO_RO = new SubsLang("RO_RO", "ro", "ro-RO");
  static readonly FA = new SubsLang("FA", "fa", "fa");
  static readonly FA_IR = new SubsLang("FA_IR", "fa", "fa-IR");
  static readonly SV = new SubsLang("SV", "sv", "sv");
  static readonly SV_SE = new SubsLang("SV_SE", "sv", "sv-SE");
  static readonly PL = new SubsLang("PL", "pl", "pl");
  static readonly PL_PL = new SubsLang("PL_PL", "pl", "pl-PL");
  static readonly ES = new SubsLang("ES", "es", "es");
  static readonly ES_ES = new SubsLang("ES_ES", "es", "es-ES");
  static readonly ES_419 = new SubsLang("ES_419", "es", "es-419");
  static readonly UK = new SubsLang("UK", "uk", "uk");
  static readonly ZH = new SubsLang("ZH", "zh", "zh");
  static readonly DE = new SubsLang("DE", "de", "de");
  static readonly BE = new SubsLang("BE", "be", "be");
  static readonly BG = new SubsLang('BG', 'bg', 'bg');
  static readonly CS = new SubsLang('CS', 'cs', 'cs');
  static readonly ET = new SubsLang('ET', 'et', 'et');
  static readonly FI = new SubsLang('FI', 'fi', 'fi');
  static readonly HR = new SubsLang('HR', 'hr', 'hr');
  static readonly HU = new SubsLang('HU', 'hu', 'hu');
  static readonly HY = new SubsLang('HY', 'hy', 'hy');
  static readonly LT = new SubsLang('LT', 'lt', 'lt');
  static readonly LV = new SubsLang('LV', 'lv', 'lv');
  static readonly MK = new SubsLang('MK', 'mk', 'mk');
  static readonly NB = new SubsLang('NB', 'nb', 'nb');
  static readonly NL = new SubsLang('NL', 'nl', 'nl');
  static readonly SL = new SubsLang('SL', 'sl', 'sl');
  static readonly SK = new SubsLang('SK', 'sk', 'sk');
  static readonly SR = new SubsLang('SR', 'sr', 'sr');
  static readonly AR = new SubsLang('AR', 'ar', 'ar');

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
    "de" : SubsLang.DE,
    "be" : SubsLang.BE,
    "bg" : SubsLang.BG,
    "cs" : SubsLang.CS,
    "et" : SubsLang.ET,
    "fi" : SubsLang.FI,
    "hr" : SubsLang.HR,
    "hu" : SubsLang.HU,
    "hy" : SubsLang.HY,
    "lt" : SubsLang.LT,
    "lv" : SubsLang.LV,
    "mk" : SubsLang.MK,
    "nb" : SubsLang.NB,
    "nl" : SubsLang.NL,
    "sl" : SubsLang.SL,
    "sk" : SubsLang.SK,
    "sr" : SubsLang.SR,
    "ar" : SubsLang.AR
  }

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
    "ger" : SubsLang.DE,
    "bel" : SubsLang.BE,
    "bul" : SubsLang.BG,
    "cze" : SubsLang.CS,
    "ces" : SubsLang.CS,
    "est" : SubsLang.ET,
    "fin" : SubsLang.FI,
    "hrv" : SubsLang.HR,
    "hun" : SubsLang.HU,
    "arm" : SubsLang.HY,
    "hye" : SubsLang.HY,
    "lit" : SubsLang.LT,
    "lav" : SubsLang.LV,
    "mac" : SubsLang.MK,
    "mkd" : SubsLang.MK,
    "nob" : SubsLang.NB,
    "nld" : SubsLang.NL,
    "dut" : SubsLang.NL,
    "slv" : SubsLang.SL,
    "slk" : SubsLang.SK,
    "slo" : SubsLang.SK,
    "srp" : SubsLang.SR,
    "ara" : SubsLang.AR
  } as const;

  static readonly subsAuthorPriorityList = {
    "RU" : [SubsAuthor.HDREZKA_18PLUS,  SubsAuthor.COOL_STORY_BLOG_18PLUS,
      SubsAuthor.HDREZKA, SubsAuthor.COOL_STORY_BLOG, SubsAuthor.TVSHOWS, SubsAuthor.KINOMANIA]
  }

  readonly key;
  readonly lang: string;
  readonly langTag: string;

  private constructor(key: string, lang: string, langTag: string) {
    this.key = key;
    this.lang = lang;
    this.langTag = langTag;
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
