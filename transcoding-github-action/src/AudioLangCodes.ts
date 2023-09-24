export const AudioLangCodes = {
  EN : { lang : "en", langTag : "en", displayName : "English" },
  EN_US : { lang : "en", langTag : "en-US", displayName : "English (US)" },
  EN_GB : { lang : "en", langTag : "en-GB", displayName : "English (GB)" },
  EN_AU : { lang : "en", langTag : "en-AU", displayName : "English (AU)" },
  RU : { lang : "ru", langTag : "ru", displayName : "Русский" },
  FR : { lang : "fr", langTag: "fr", displayName : "Français" },
  JA : { lang : "ja", langTag: "ja", displayName : "日本" }
} as const;

export class AudioLangCode {
  readonly code: keyof typeof AudioLangCodes;
  
  public constructor(code: keyof typeof AudioLangCodes) {
    if (!(code in AudioLangCodes)) {
      throw new InvalidAudioLangCodeError();
    }
    this.code = code;
  }
}

class InvalidAudioLangCodeError extends Error {}
