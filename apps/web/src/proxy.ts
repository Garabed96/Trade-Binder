import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const SUPPORTED_LOCALES = ["en", "th"];
const DEFAULT_LOCALE = "en";

const PROTECTED_ROUTES = ["/binders", "/settings"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1️⃣ Locale handling
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  let locale = DEFAULT_LOCALE;

  if (!pathnameHasLocale) {
    locale =
      request.cookies.get("NEXT_LOCALE")?.value ||
      request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ||
      DEFAULT_LOCALE;

    if (!SUPPORTED_LOCALES.includes(locale)) {
      locale = DEFAULT_LOCALE;
    }

    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  // Strip locale for auth checks
  const pathnameWithoutLocale = pathname.replace(/^\/(en|th)/, "");

  // 2️⃣ Auth protection
  const isProtected = PROTECTED_ROUTES.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (isProtected) {
    const token = await getToken({ req: request });

    if (!token) {
      const signInUrl = new URL(`/${locale}/auth/sign-in`, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon|public).*)"],
};
