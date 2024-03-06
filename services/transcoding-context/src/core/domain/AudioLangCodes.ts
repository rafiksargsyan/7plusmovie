export const AudioLangCodes = {
  EN : { lang : "en", langTag : "en" },
  EN_US : { lang : "en", langTag : "en-US" },
  EN_GB : { lang : "en", langTag : "en-GB" },
  EN_AU : { lang : "en", langTag : "en-AU" },
  RU : { lang : "ru", langTag : "ru" },
  FR : { lang : "fr", langTag: "fr" },
  JA : { lang : "ja", langTag: "ja" },
  PT : { lang : "pt", langTag: "pt" },
  KO : { lang : "ko", langTag: "ko" },
  DA : { lang : "da", langTag: "da" },
  HI : { lang : "hi", langTag: "hi" },
  HI_IN : { lang : "hi", langTag: "hi-IN" },
  IT : { lang : "it", langTag: "it" },
  RO : { lang : "ro", langTag: "ro" },
  RO_RO : { lang : "ro", langTag: "ro-RO" },
  FA : { lang : "fa", langTag: "fa" },
  FA_IR : { lang : "fa", langTag: "fa-IR" },
  SV : { lang : "sv", langTag: "sv" },
  SV_SE : { lang : "sv", langTag: "sv-SE" },
  PL : { lang : "pl", langTag: "pl" },
  PL_PL : { lang : "pl", langTag: "pl-PL" }
} as const;

export class AudioLangCode {
  readonly code: string;
  
  public constructor(code: string) {
    if (!(code in AudioLangCodes)) {
      throw new InvalidAudioLangCodeError();
    }
    this.code = code;
  }
}

class InvalidAudioLangCodeError extends Error {}
