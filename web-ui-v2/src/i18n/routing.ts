import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export class Locale {
  static readonly EN_US = new Locale("EN_US", "en-US", "English (US)");
  static readonly RU = new Locale("RU", "ru", "Русский");
  static readonly HY = new Locale("HY", "hy", "Հայերեն");
  static readonly ES_ES = new Locale("ES_ES", "es-ES", "Española (españa)");
  static readonly FR_FR = new Locale("FR_FR", "fr-FR", "Français (France)");
  static readonly IT = new Locale("IT", "it", "Italiana");
  static readonly HI = new Locale("HI", "hi", "हिन्दी");

  static readonly FROM_LANG_TAG: { [langTag: string]: Locale } = {
    "ru" : Locale.RU,
    "en-US" : Locale.EN_US,
    "hy" : Locale.HY,
    "es-ES" : Locale.ES_ES,
    "fr-FR" : Locale.FR_FR,
    "it" : Locale.IT,
    "hi" : Locale.HI
  } as const;

  static readonly FROM_NATIVE_DISPLAY_NAME: { [nativeDisplayName: string]: Locale } = {
    "English (US)" : Locale.EN_US,
    "Русский" : Locale.RU,
    "Հայերեն" : Locale.HY,
    "Española (españa)" : Locale.ES_ES,
    "Français (France)" : Locale.FR_FR,
    "Italiana": Locale.IT,
    "हिन्दी": Locale.HI
  }

  readonly key: string;
  readonly langTag: string;
  readonly nativeDisplayName: string;

  private constructor(key: string, langTag: string, nativeDisplayName: string) {
    this.key = key;
    this.langTag = langTag;
    this.nativeDisplayName = nativeDisplayName;
  }
}

export const routing = defineRouting({
  locales: Object.keys(Locale.FROM_LANG_TAG),
  defaultLocale: 'en-US',
  localePrefix: 'as-needed',
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
