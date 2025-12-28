// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'th'];
const DEFAULT_LOCALE = 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if locale is already in path
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Get locale from Accept-Language header or cookie
  const locale =
    request.cookies.get('NEXT_LOCALE')?.value ||
    request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ||
    DEFAULT_LOCALE;

  const supportedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

  return NextResponse.redirect(new URL(`/${supportedLocale}${pathname}`, request.url));
}

export const config = {
  matcher: ['/((?!api|_next|public|favicon).*)'],
};
