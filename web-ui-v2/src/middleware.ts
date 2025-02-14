import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl; 
  
  // handle old urls
  if (pathname.startsWith('/player') || pathname.startsWith('/ru/player') || pathname.startsWith('/en-US/player')) {
    const movieId = request.nextUrl.searchParams.get('movieId');
    const tvShowId = request.nextUrl.searchParams.get('tvShowId');
    const season = request.nextUrl.searchParams.get('season');
    const episode = request.nextUrl.searchParams.get('episode');
    const locale = (pathname.startsWith('/player') || pathname.startsWith('/en-US/player')) ? 'en-US' : 'ru';
    let redirectUrl;
    if (movieId != null) {
      redirectUrl = new URL(`/${locale}/movie/?id=${movieId}`, request.nextUrl.origin);
    } else if (tvShowId != null) {
      redirectUrl = new URL(`/${locale}/tv-show/?id=${tvShowId}&e=${episode}&s=${season}`, request.nextUrl.origin);
    }
    if (redirectUrl != null) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  const handleI18nRouting = createMiddleware(routing);
  const response = handleI18nRouting(request);
 
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
