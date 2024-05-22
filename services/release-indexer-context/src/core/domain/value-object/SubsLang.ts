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
    PL_PL: SubsLang.PL_PL
  } as const;

  static from(key: Nullable<string>): SubsLang {
    if (key == null || !(key in this.values)) {
      throw new InvalidSubsLangKeyError();
    }
    return this.values[key];
  }
}

export class InvalidSubsLangKeyError extends Error {}
