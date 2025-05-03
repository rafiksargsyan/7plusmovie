export const L8nLangCodes = {
  EN_US : { langTag : "en-US" },
  EN_GB : { langTag : "en-GB" },
  EN_AU : { langTag : "en-AU" },
  RU : { langTag : "ru" },
  IT : { langTag : "it" },
  FR : { langTag : "fr" },
  JA : { langTag : "ja" },
  ES : { langTag : "es" },
  PT : { langTag : "pt" },
  KO : { langTag : "ko" },
  DA : { langTag : "da" },
  HI : { langTag : "hi" },
  HI_IN : { langTag : "hi-IN" },
  RO : { langTag: "ro" },
  RO_RO : { langTag: "ro-RO" },
  FA : { langTag: "fa" },
  FA_IR : { langTag: "fa-IR" },
  SV : { langTag: "sv" },
  SV_SE : { langTag: "sv-SE" },
  PL : { langTag: "pl" },
  PL_PL : { langTag: "pl-PL" },
  DE : { langTag: "de" },
  DE_DE: { langTag: "de-DE"}
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
