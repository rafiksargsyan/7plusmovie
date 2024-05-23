import { Nullable } from "../../../Nullable";

export class SubsLang {
  public static readonly EN = new SubsLang();
  public static readonly EN_US = new SubsLang();
  public static readonly EN_GB = new SubsLang();
  public static readonly RU = new SubsLang();
  public static readonly FR = new SubsLang();
  public static readonly JA = new SubsLang();
  public static readonly PT = new SubsLang();
  public static readonly KO = new SubsLang();
  public static readonly DA = new SubsLang();
  public static readonly HI = new SubsLang();
  public static readonly HI_IN = new SubsLang();
  public static readonly IT = new SubsLang();
  public static readonly RO = new SubsLang();
  public static readonly RO_RO = new SubsLang();
  public static readonly FA = new SubsLang();
  public static readonly FA_IR = new SubsLang();
  public static readonly SV = new SubsLang();
  public static readonly SV_SE = new SubsLang();
  public static readonly PL = new SubsLang();
  public static readonly PL_PL = new SubsLang();
  public static readonly ES = new SubsLang();
  public static readonly ES_ES = new SubsLang();
  public static readonly ES_419 = new SubsLang();

  private static readonly values = {
    EN: SubsLang.EN,
    EN_US: SubsLang.EN_US,
    EN_GB: SubsLang.EN_GB,
    RU: SubsLang.RU,
    FR: SubsLang.FR,
    JA: SubsLang.JA,
    PT: SubsLang.PT,
    KO: SubsLang.KO,
    DA: SubsLang.DA,
    HI: SubsLang.HI,
    HI_IN: SubsLang.HI_IN,
    IT: SubsLang.IT,
    RO: SubsLang.RO,
    RO_RO: SubsLang.RO_RO,
    FA: SubsLang.FA,
    FA_IR: SubsLang.FA_IR,
    SV: SubsLang.SV,
    SV_SE: SubsLang.SV_SE,
    PL: SubsLang.PL,
    PL_PL: SubsLang.PL_PL,
    ES: SubsLang.ES,
    ES_ES: SubsLang.ES_ES,
    ES_419: SubsLang.ES_419
  } as const;

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
    "es" : SubsLang.ES
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
    "spa" : SubsLang.ES
  } as const;

  public static from(key: Nullable<string>): Nullable<SubsLang> {
    if (key == null) return null;
    if (!(key in this.values)) {
      throw new InvalidSubsLangKeyError();
    }
    return this.values[key];
  }

  public static fromISO_639_2(code: Nullable<string>) {
    if (code == null) return null;
    return this.FROM_ISO_639_2[code];
  }

  public static fromISO_639_1(code: Nullable<string>) {
    if (code == null) return null;
    return this.FROM_ISO_639_1[code];
  }
}

export class InvalidSubsLangKeyError extends Error {}
