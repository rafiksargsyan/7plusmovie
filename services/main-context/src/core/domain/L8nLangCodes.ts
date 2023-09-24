export const L8nLangCodes = {
  EN_US : { langTag : "en-US" },
  EN_GB : { langTag : "en-GB" },
  EN_AU : { langTag : "en-AU" },
  RU : { langTag : "ru" },
  IT : { langTag : "it" },
  FR : { langTag : "fr" },
  JA : { langTag : "ja" },
  ES : { langTag : "es" }
} as const;

export class L8nLangCode {
  readonly code: string;
  
  public constructor(code: string) {
    if (!(code in L8nLangCodes)) {
      throw new InvalidL8nLangCodeError();
    }
    this.code = code;
  }
}

class InvalidL8nLangCodeError extends Error {}
