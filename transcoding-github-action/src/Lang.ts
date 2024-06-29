import {Nullable} from './nullable'

export class Lang {
  static readonly EN = new Lang('EN', 'en')
  static readonly RU = new Lang('RU', 'ru')
  static readonly FR = new Lang('FR', 'fr')
  static readonly JA = new Lang('JA', 'ja')
  static readonly PT = new Lang('PT', 'pt')
  static readonly KO = new Lang('KO', 'ko')
  static readonly DA = new Lang('DA', 'da')
  static readonly HI = new Lang('HI', 'hi')
  static readonly IT = new Lang('IT', 'it')
  static readonly RO = new Lang('RO', 'ro')
  static readonly FA = new Lang('FA', 'fa')
  static readonly SV = new Lang('SV', 'sv')
  static readonly PL = new Lang('PL', 'pl')
  static readonly ES = new Lang('ES', 'es')
  static readonly UK = new Lang('UK', 'uk')
  static readonly ZH = new Lang('ZH', 'zh')
  static readonly DE = new Lang('DE', 'de')

  readonly key: string
  readonly lang: string

  private constructor(key: string, lang: string) {
    this.key = key
    this.lang = lang
  }

  static fromKeyOrThrow(key: string): Lang {
    if (key == null || Lang[key] == null) {
      throw new InvalidLangKeyError()
    }
    return Lang[key]
  }

  static fromKey(key: Nullable<string>): Nullable<Lang> {
    if (key == null) return null
    return Lang[key]
  }
}

export class InvalidLangKeyError extends Error {}
