import { Nullable } from "../../../Nullable";

export class L8nLang {
  static readonly EN = new L8nLang("EN", "en", "en");
  static readonly EN_US = new L8nLang("EN_US","en", "en-US");
  static readonly EN_GB = new L8nLang("EN_GB", "en", "en-GB");
  static readonly EN_AU = new L8nLang("EN_AU", "en", "en-AU");
  static readonly RU = new L8nLang("RU", "ru", "ru");
  static readonly FR = new L8nLang("FR", "fr", "fr");
  static readonly JA = new L8nLang("JA", "ja", "ja");
  static readonly PT = new L8nLang("PT", "pt", "pt");
  static readonly PT_BR = new L8nLang("PT_BR", "pt", "pt-BR");
  static readonly PT_PT = new L8nLang("PT_PT", "pt", "pt-PT");
  static readonly KO = new L8nLang("KO", "ko", "ko");
  static readonly DA = new L8nLang("DA", "da", "da");
  static readonly HI = new L8nLang("HI", "hi", "hi");
  static readonly HI_IN = new L8nLang("HI_IN", "hi", "hi-IN");
  static readonly IT = new L8nLang("IT", "it", "it");
  static readonly RO = new L8nLang("RO", "ro", "ro");
  static readonly RO_RO = new L8nLang("RO_RO", "ro", "ro-RO");
  static readonly FA = new L8nLang("FA", "fa", "fa");
  static readonly FA_IR = new L8nLang("FA_IR", "fa", "fa-IR");
  static readonly SV = new L8nLang("SV", "sv", "sv");
  static readonly SV_SE = new L8nLang("SV_SE", "sv", "sv-SE");
  static readonly PL = new L8nLang("PL", "pl", "pl");
  static readonly PL_PL = new L8nLang("PL_PL", "pl", "pl-PL");
  static readonly ES = new L8nLang("ES", "es", "es");
  static readonly ES_ES = new L8nLang("ES_ES", "es", "es-ES");
  static readonly ES_419 = new L8nLang("ES_419", "es", "es-419");
  static readonly UK = new L8nLang("UK", "uk", "uk");
  static readonly ZH = new L8nLang("ZH", "zh", "zh");
  static readonly DE = new L8nLang("DE", "de", "de");
  static readonly BE = new L8nLang("BE", "be", "be");
  static readonly BG = new L8nLang('BG', 'bg', 'bg');
  static readonly CS = new L8nLang('CS', 'cs', 'cs');
  static readonly ET = new L8nLang('ET', 'et', 'et');
  static readonly FI = new L8nLang('FI', 'fi', 'fi');
  static readonly HR = new L8nLang('HR', 'hr', 'hr');
  static readonly HU = new L8nLang('HU', 'hu', 'hu');
  static readonly HY = new L8nLang('HY', 'hy', 'hy');
  static readonly LT = new L8nLang('LT', 'lt', 'lt');
  static readonly LV = new L8nLang('LV', 'lv', 'lv');
  static readonly MK = new L8nLang('MK', 'mk', 'mk');
  static readonly NB = new L8nLang('NB', 'nb', 'nb');
  static readonly NL = new L8nLang('NL', 'nl', 'nl');
  static readonly SL = new L8nLang('SL', 'sl', 'sl');
  static readonly SK = new L8nLang('SK', 'sk', 'sk');
  static readonly SR = new L8nLang('SR', 'sr', 'sr');
  static readonly AR = new L8nLang('AR', 'ar', 'ar');

  readonly key;
  readonly lang;
  readonly langTag;

  private constructor(key: string, lang: string, langTag: string) {
    this.key = key;
    this.langTag = langTag;
    this.lang = lang;
  }

  static fromKeyOrThrow(key: string): L8nLang {
    if (key == null || L8nLang[key] == null) {
      throw new InvalidL8nLangKeyError();
    }
    return L8nLang[key];
  }

  static fromKey(key: Nullable<string>): Nullable<L8nLang> {
    if (key == null) return null;
    return L8nLang[key];
  }

}

export class InvalidL8nLangKeyError extends Error {}
