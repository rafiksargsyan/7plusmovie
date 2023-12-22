export const AudioLangCodes = {
  EN : { lang : "en", langTag : "en" },
  EN_US : { lang : "en", langTag : "en-US" },
  EN_GB : { lang : "en", langTag : "en-GB" },
  EN_AU : { lang : "en", langTag : "en-AU" },
  RU : { lang : "ru", langTag : "ru" },
  FR : { lang : "fr", langTag: "fr" },
  JA : { lang : "ja", langTag: "ja" },
  PT : { lang : "pt", langTag: "pt" },
  KO : { lang : "ko", langTag: "ko" }
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
