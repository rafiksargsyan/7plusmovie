import { Nullable } from "../../utils";

export class AudioLang {
  static readonly EN = new AudioLang("EN", "en", "en", "English");
  static readonly EN_US = new AudioLang("EN_US", "en", "en-US", "English (US)");
  static readonly EN_GB = new AudioLang("EN_GB", "en", "en-GB", "English (GB)");
  static readonly EN_AU = new AudioLang("EN_AU", "en", "en-AU", "English (AU)");
  static readonly RU = new AudioLang("RU", "ru", "ru", "Russian");
  static readonly FR = new AudioLang("FR", "fr", "fr", "French");
  static readonly FR_FR = new AudioLang("FR_FR", "fr", "fr-FR", "French (France)");
  static readonly FR_CA = new AudioLang("FR_CA", "fr", "fr-CA", "French (Canada)");
  static readonly JA = new AudioLang("JA", "ja", "ja", "Japanese");
  static readonly PT = new AudioLang("PT", "pt", "pt", "Portuguese");
  static readonly PT_BR = new AudioLang("PT_BR", "pt", "pt-BR", "Portuguese (Brazil)");
  static readonly PT_PT = new AudioLang("PT_PT", "pt", "pt-PT", "Portuguese (Portugal)");
  static readonly KO = new AudioLang("KO", "ko", "ko", "Korean");
  static readonly DA = new AudioLang("DA", "da", "da", "Danish");
  static readonly HI = new AudioLang("HI", "hi", "hi", "Hindi");
  static readonly HI_IN = new AudioLang("HI_IN", "hi", "hi-IN", "Hindi (India)");
  static readonly IT = new AudioLang("IT", "it", "it", "Italian");
  static readonly RO = new AudioLang("RO", "ro", "ro", "Romanian");
  static readonly RO_RO = new AudioLang("RO_RO", "ro", "ro-RO", "Romanian (Romania)");
  static readonly FA = new AudioLang("FA", "fa", "fa", "Farsi");
  static readonly FA_IR = new AudioLang("FA_IR", "fa", "fa-IR", "Farsi (Iran)");
  static readonly SV = new AudioLang("SV", "sv", "sv", "Swedish");
  static readonly SV_SE = new AudioLang("SV_SE", "sv", "sv-SE", "Swedish (Sweden)");
  static readonly PL = new AudioLang("PL", "pl", "pl", "Polish");
  static readonly PL_PL = new AudioLang("PL_PL", "pl", "pl-PL", "Polish (Poland)");
  static readonly ES = new AudioLang("ES", "es", "es", "Spanish");
  static readonly ES_ES = new AudioLang("ES_ES", "es", "es-ES", "Spanish (Spain)");
  static readonly ES_419 = new AudioLang("ES_419", "es", "es-419", "Spanish (Latin American)");
  static readonly UK = new AudioLang("UK", "uk", "uk", "Ukrainian");
  static readonly ZH = new AudioLang("ZH", "zh", "zh", "Chinese");
  static readonly DE = new AudioLang("DE", "de", "de", "German");
  static readonly BE = new AudioLang("BE", "be", "be", "Belarusian");
  static readonly BG = new AudioLang('BG', 'bg', 'bg', "Bulgarian");
  static readonly CS = new AudioLang('CS', 'cs', 'cs', "Czech");
  static readonly ET = new AudioLang('ET', 'et', 'et', "Estonian");
  static readonly FI = new AudioLang('FI', 'fi', 'fi', "Finnish");
  static readonly HR = new AudioLang('HR', 'hr', 'hr', "Croatian");
  static readonly HU = new AudioLang('HU', 'hu', 'hu', "Hungarian");
  static readonly HY = new AudioLang('HY', 'hy', 'hy', "Armenian");
  static readonly LT = new AudioLang('LT', 'lt', 'lt', "Lithuanian");
  static readonly LV = new AudioLang('LV', 'lv', 'lv', "Latvian");
  static readonly MK = new AudioLang('MK', 'mk', 'mk', "Macedonian");
  static readonly NB = new AudioLang('NB', 'nb', 'nb', "Norwegian (Bokm?l)");
  static readonly NL = new AudioLang('NL', 'nl', 'nl', "Dutch");
  static readonly SL = new AudioLang('SL', 'sl', 'sl', "Slovenian");
  static readonly SK = new AudioLang('SK', 'sk', 'sk', "Slovak");
  static readonly SR = new AudioLang('SR', 'sr', 'sr', "Serbian");
  static readonly AR = new AudioLang('AR', 'ar', 'ar', "Arabic");
  static readonly HE = new AudioLang('HE', 'he', 'he', 'Hebrew');

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
    "ar" : AudioLang.AR,
    "he" : AudioLang.HE
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
    "ara" : AudioLang.AR,
    "heb" : AudioLang.HE
  } as const;

  readonly key: string;
  readonly lang: string;
  readonly langTag: string;
  readonly name: string

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
