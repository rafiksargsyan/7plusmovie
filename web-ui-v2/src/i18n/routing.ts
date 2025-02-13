import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export class Locale {
  static readonly EN_US = new Locale("EN_US", "en-US", "English (US)");
  static readonly RU = new Locale("RU", "ru", "Русский");
  static readonly HY = new Locale("HY", "hy", "Հայերեն");
  static readonly ES_ES = new Locale("ES_ES", "es-ES", "Española (españa)")

  static readonly FROM_LANG_TAG: { [langTag: string]: Locale } = {
    "ru" : Locale.RU,
    "en-US" : Locale.EN_US,
    "hy" : Locale.HY,
    "es-ES" : Locale.ES_ES
  } as const;

  static readonly FROM_NATIVE_DISPLAY_NAME: { [nativeDisplayName: string]: Locale } = {
    "English (US)" : Locale.EN_US,
    "Русский" : Locale.RU,
    "Հայերեն" : Locale.HY,
    "Española (españa)" : Locale.ES_ES
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
  locales: ['en-US', 'ru', 'hy', 'es-ES'],
  defaultLocale: 'en-US'
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
