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
  static readonly BE = new Lang('BE', 'be')
  static readonly BG = new Lang('BG', 'bg')
  static readonly CS = new Lang('CS', 'cs')
  static readonly ET = new Lang('ET', 'et')
  static readonly FI = new Lang('FI', 'fi')
  static readonly HR = new Lang('HR', 'hr')
  static readonly HU = new Lang('HU', 'hu')
  static readonly HY = new Lang('HY', 'hy')
  static readonly LT = new Lang('LT', 'lt')
  static readonly LV = new Lang('LV', 'lv')
  static readonly MK = new Lang('MK', 'mk')
  static readonly NB = new Lang('NB', 'nb')
  static readonly NL = new Lang('NL', 'nl')
  static readonly SL = new Lang('SL', 'sl')
  static readonly SK = new Lang('SK', 'sk')
  static readonly SR = new Lang('SR', 'sr')
  static readonly AR = new Lang('AR', 'ar')

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
