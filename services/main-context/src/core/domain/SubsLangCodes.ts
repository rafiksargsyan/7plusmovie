export const SubsLangCodes = {
  EN : { lang : "en", langTag : "en" },
  EN_US : { lang : "en", langTag : "en-US" },
  EN_GB : { lang : "en", langTag : "en-GB" },
  RU : { lang : "ru", langTag : "ru" }  
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
