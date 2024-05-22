import { Nullable } from "../../../Nullable";

export class AudioLang {
  public static readonly EN = new AudioLang("en", "en");
  public static readonly EN_US = new AudioLang("en", "en-US");
  public static readonly EN_GB = new AudioLang("en", "en-GB");
  public static readonly EN_AU = new AudioLang("en", "en-AU");
  public static readonly RU = new AudioLang("ru", "ru");
  public static readonly FR = new AudioLang("fr", "fr");
  public static readonly JA = new AudioLang("ja", "ja");
  public static readonly PT = new AudioLang("pt", "pt");
  public static readonly KO = new AudioLang("ko", "ko");
  public static readonly DA = new AudioLang("da", "da");
  public static readonly HI = new AudioLang("hi", "hi");
  public static readonly HI_IN = new AudioLang("hi", "hi-IN");
  public static readonly IT = new AudioLang("it", "it");
  public static readonly RO = new AudioLang("ro", "ro");
  public static readonly RO_RO = new AudioLang("ro", "ro-RO");
  public static readonly FA = new AudioLang("fa", "fa");
  public static readonly FA_IR = new AudioLang("fa", "fa-IR");
  public static readonly SV = new AudioLang("sv", "sv");
  public static readonly SV_SE = new AudioLang("sv", "sv-SE");
  public static readonly PL = new AudioLang("pl", "pl");
  public static readonly PL_PL = new AudioLang("pl", "pl-PL");

  private static readonly values = {
    EN: AudioLang.EN,
    EN_US: AudioLang.EN_US,
    EN_GB: AudioLang.EN_GB,
    EN_AU: AudioLang.EN_AU,
    RU: AudioLang.RU,
    FR: AudioLang.FR,
    JA: AudioLang.JA,
    PT: AudioLang.PT,
    KO: AudioLang.KO,
    DA: AudioLang.DA,
    HI: AudioLang.HI,
    HI_IN: AudioLang.HI_IN,
    IT: AudioLang.IT,
    RO: AudioLang.RO,
    RO_RO: AudioLang.RO_RO,
    FA: AudioLang.FA,
    FA_IR: AudioLang.FA_IR,
    SV: AudioLang.SV,
    SV_SE: AudioLang.SV_SE,
    PL: AudioLang.PL,
    PL_PL: AudioLang.PL_PL
  } as const;

  private readonly _lang: string;
  private readonly _langTag: string;

  private constructor(lang: string, langTag: string) {
    this._lang = lang;
    this._langTag = langTag;
  }

  get lang(): string {
    return this._lang;
  }

  get langTag(): string {
    return this._langTag;
  }

  static from(key: Nullable<string>): AudioLang {
    if (key == null || !(key in this.values)) {
      throw new InvalidAudioLangKeyError();
    }
    return this.values[key];
  }
}

export class InvalidAudioLangKeyError extends Error {}
