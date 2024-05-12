export const SubsLangCodes: { [key: string] : { lang : string, langTag : string, name : string } } = {
  EN : { lang : "en", langTag : "en", name : "English" },
  EN_US : { lang : "en", langTag : "en-US", name : "English (US)" },
  EN_GB : { lang : "en", langTag : "en-GB", name : "English (GB)" },
  RU : { lang : "ru", langTag : "ru", name : "Russian" },
//  RU_FORCED : { lang: "ru", langTag : "ru-x-forced" },
//  EN_US_FORCED : { lang: "en", langTag : "en-US-x-forced" },
  FR : { lang : "fr", langTag : "fr", name : "French" },
  JA : { lang : "ja", langTag : "ja", name : "Japanese" },
  PT : { lang : "pt", langTag : "pt", name : "Portuguese" },
  KO : { lang : "ko", langTag : "ko", name : "Korean" },
  DA : { lang : "da", langTag : "da", name : "Danish" },
  HI : { lang : "hi", langTag: "hi", name : "Hindi" },
  HI_IN : { lang : "hi", langTag: "hi-IN", name : "Hindi (India)" },
  IT : { lang : "it", langTag: "it", name: "Italian" },
  RO : { lang : "ro", langTag: "ro", name: "Romanian" },
  RO_RO : { lang : "ro", langTag: "ro-RO", name: "Romanian (Romania)" },
  FA : { lang : "fa", langTag: "fa", name: "Farsi" },
  FA_IR : { lang : "fa", langTag: "fa-IR", name: "Farsi (Iran)" },
  SV : { lang : "sv", langTag: "sv", name: "Swedish" },
  SV_SE : { lang : "sv", langTag: "sv-SE", name: "Swedish (Sweden)" },
  PL : { lang : "pl", langTag: "pl" , name: "Polish"},
  PL_PL : { lang : "pl", langTag: "pl-PL", name: "Polish (Poland)" }
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
