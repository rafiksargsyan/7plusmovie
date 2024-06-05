import { Nullable } from "../../../Nullable";
import { SubsAuthor } from "./SubsAuthor";

export class SubsLang {
  public static readonly EN = new SubsLang("EN");
  public static readonly EN_US = new SubsLang("EN_US");
  public static readonly EN_GB = new SubsLang("EN_GB");
  public static readonly RU = new SubsLang("RU");
  public static readonly FR = new SubsLang("FR");
  public static readonly JA = new SubsLang("JA");
  public static readonly PT = new SubsLang("PT");
  public static readonly KO = new SubsLang("KO");
  public static readonly DA = new SubsLang("DA");
  public static readonly HI = new SubsLang("HI");
  public static readonly HI_IN = new SubsLang("HI_IN");
  public static readonly IT = new SubsLang("IT");
  public static readonly RO = new SubsLang("RO");
  public static readonly RO_RO = new SubsLang("RO_RO");
  public static readonly FA = new SubsLang("FA");
  public static readonly FA_IR = new SubsLang("FA_IR");
  public static readonly SV = new SubsLang("SV");
  public static readonly SV_SE = new SubsLang("SV_SE");
  public static readonly PL = new SubsLang("PL");
  public static readonly PL_PL = new SubsLang("PL_PL");
  public static readonly ES = new SubsLang("ES");
  public static readonly ES_ES = new SubsLang("ES_ES");
  public static readonly ES_419 = new SubsLang("ES_419");
  public static readonly UK = new SubsLang("UK");

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
    "uk" : SubsLang.UK
  } as const;
   
  private static readonly FROM_ISO_639_1 = {
    "eng" : SubsLang.EN,
    "rus" : SubsLang.RU,
    "fra" : SubsLang.FR,
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
    "ukr" : SubsLang.UK
  } as const;

  public static readonly subsAuthorPriorityList = {
    "RU" : [SubsAuthor.HDREZKA_18PLUS,  SubsAuthor.COOL_STORY_BLOG_18PLUS,
      SubsAuthor.HDREZKA, SubsAuthor.COOL_STORY_BLOG, SubsAuthor.TVSHOWS]
  }

  public readonly key;

  private constructor(key: string) {
    this.key = key;
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
}

export class InvalidSubsLangKeyError extends Error {}
