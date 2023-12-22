export const SubsLangCodes = {
  EN : { lang : "en", langTag : "en" },
  EN_US : { lang : "en", langTag : "en-US" },
  EN_GB : { lang : "en", langTag : "en-GB" },
  RU : { lang : "ru", langTag : "ru" },
  RU_FORCED : { lang: "ru", langTag : "ru-x-forced"},
  EN_US_FORCED : { lang: "en", langTag : "en-US-x-forced"},
  FR : { lang : "fr", langTag : "fr" },
  JA : { lang : "ja", langTag : "ja" },
  PT : { lang : "pt", langTag : "pt" },
  KO : { lang : "ko", langTag: "ko" }
} as const;

export class SubsLangCode {
  readonly code: string;
  
  public constructor(code: string) {
    if (!(code in SubsLangCodes)) {
      throw new InvalidSubsLangCodeError();
    }
    this.code = code;
  }
}

class InvalidSubsLangCodeError extends Error {}
