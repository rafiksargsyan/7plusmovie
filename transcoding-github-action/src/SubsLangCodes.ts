export const SubsLangCodes = {
  EN : { lang : "en", langTag : "en", displayName : "English" },
  EN_US : { lang : "en", langTag : "en-US" , displayName : "English (US)" },
  EN_GB : { lang : "en", langTag : "en-GB" , displayName : "English (GB)" },
  RU : { lang : "ru", langTag : "ru", displayName : "Русский" },
  RU_FORCED : { lang: "ru", langTag : "ru-x-forced", displayName : "Русский (форсированный)" },
  EN_US_FORCED : { lang: "en", langTag : "en-US-x-forced", displayName : "English (US) (forced)" },
  FR : { lang : "fr", langTag : "fr", displayName : "Français" },
  JA : { lang : "ja", langTag : "ja", displayName : "日本" },
  PT : { lang : "pt", langTag: "pt", displayName : "Português" },
  KO : { lang : "ko", langTag: "ko", displayName : "한국인" },
  DA : { lang : "da", langTag: "da", displayName : "dansk" },
  HI : { lang : "hi", langTag: "hi", displayName : "हिंदी" },
  HI_IN : { lang : "hi", langTag: "hi-IN", displayName : "हिंदी (भारत)" },
  IT : { lang : "it", langTag: "it", displayName : "Italiano" },
  RO : { lang : "ro", langTag: "ro", displayName : "Română" },
  RO_RO : { lang : "ro", langTag: "ro-RO", displayName : "Română (România)" },
  FA : { lang : "fa", langTag: "fa", displayName : "فارسی" },
  FA_IR : { lang : "fa", langTag: "fa-IR", displayName : "فارسی (ایران)" },
  SV : { lang : "sv", langTag: "sv", displayName: "svenska" },
  SV_SE : { lang : "sv", langTag: "sv-SE", displayName: "svenska (Sverige)" }
} as const;

export class SubsLangCode {
  readonly code: keyof typeof SubsLangCodes;
  
  public constructor(code: keyof typeof SubsLangCodes) {
    if (!(code in SubsLangCodes)) {
      throw new InvalidSubsLangCodeError();
    }
    this.code = code;
  }
}

class InvalidSubsLangCodeError extends Error {}
