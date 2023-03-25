export const L8nLangCodes = {
  EN_US : { langTag : "en-US" },
  EN_GB : { langTag : "en-GB" },
  RU : { langTag : "ru" }
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
