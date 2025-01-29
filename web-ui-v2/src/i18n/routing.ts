import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['en-US', 'ru'],
  defaultLocale: 'en-US'
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);