import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "./AudioAuthor";

export class AudioLang {
  public static readonly EN = new AudioLang("en", "en", []);
  public static readonly EN_US = new AudioLang("en", "en-US", []);
  public static readonly EN_GB = new AudioLang("en", "en-GB", []);
  public static readonly EN_AU = new AudioLang("en", "en-AU", []);
  public static readonly RU = new AudioLang("ru", "ru", [ AudioAuthor.HDREZKA, AudioAuthor.TVSHOWS, AudioAuthor.LOSTFILM, AudioAuthor.BRAVO_RECORDS_GEORGIA ]);
  public static readonly FR = new AudioLang("fr", "fr", []);
  public static readonly JA = new AudioLang("ja", "ja", []);
  public static readonly PT = new AudioLang("pt", "pt", []);
  public static readonly KO = new AudioLang("ko", "ko", []);
  public static readonly DA = new AudioLang("da", "da", []);
  public static readonly HI = new AudioLang("hi", "hi", []);
  public static readonly HI_IN = new AudioLang("hi", "hi-IN", []);
  public static readonly IT = new AudioLang("it", "it", []);
  public static readonly RO = new AudioLang("ro", "ro", []);
  public static readonly RO_RO = new AudioLang("ro", "ro-RO", []);
  public static readonly FA = new AudioLang("fa", "fa", []);
  public static readonly FA_IR = new AudioLang("fa", "fa-IR", []);
  public static readonly SV = new AudioLang("sv", "sv", []);
  public static readonly SV_SE = new AudioLang("sv", "sv-SE", []);
  public static readonly PL = new AudioLang("pl", "pl", []);
  public static readonly PL_PL = new AudioLang("pl", "pl-PL", []);
  public static readonly ES = new AudioLang("es", "es", []);
  public static readonly ES_ES = new AudioLang("es", "es-ES", []);
  public static readonly ES_419 = new AudioLang("es", "es-419", []);

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
    PL_PL: AudioLang.PL_PL,
    ES: AudioLang.ES,
    ES_ES: AudioLang.ES_ES,
    ES_419: AudioLang.ES_419
  } as const;

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
    "es" : AudioLang.ES
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
    "spa" : AudioLang.ES
  } as const;

  public readonly lang: string;
  public readonly langTag: string;
  public readonly audioAuthorPriorityList: AudioAuthor[];

  private constructor(lang: string, langTag: string, audioAuthorPriorityList: AudioAuthor[]) {
    this.lang = lang;
    this.langTag = langTag;
    this.audioAuthorPriorityList = audioAuthorPriorityList;
  }

  public static from(key: Nullable<string>): AudioLang {
    if (key == null || !(key in this.values)) {
      throw new InvalidAudioLangKeyError();
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

export class InvalidAudioLangKeyError extends Error {}
