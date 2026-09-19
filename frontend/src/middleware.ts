import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "./lib/authentication/auth";

const publicPages = new Set([
  "/login",
  "/favicon.ico",
  "/forgot-password",
  "/reset-password",
]);

const publicPathPrefixes = ["/images"];

export default async function middleware(req: NextRequest) {
  // Skip for specific paths
  if (
    req.nextUrl.pathname.includes("/api/auth") ||
    req.nextUrl.pathname.includes("/_next")
  ) {
    return NextResponse.next();
  }

  // Step 1: Handle locale determination
  const pathname = req.nextUrl.pathname;
  const pathnameHasLocale = /^\/(?:ar|en)(?:\/|$)/.test(pathname);

  // Redirect to default locale if no locale in pathname
  if (!pathnameHasLocale) {
    const defaultLocale = "ar"; // Default locale
    const newUrl = new URL(`/${defaultLocale}${pathname}`, req.url);

    newUrl.search = req.nextUrl.search;

    return NextResponse.redirect(newUrl);
  }

  // Extract locale from pathname
  const locale = pathname.split("/")[1];
  const pathnameWithoutLocale =
    pathname.replace(/^\/(?:ar|en)(?=\/|$)/, "") || "/";

  // Step 2: Check authentication
  const session = await auth();
  const isPublicPage =
    publicPages.has(pathnameWithoutLocale) ||
    publicPathPrefixes.some((prefix) =>
      pathnameWithoutLocale.startsWith(prefix),
    );

  if (session?.expires) {
    const now = Date.now();
    const expiration = new Date(session.expires).getTime();

    if (now > expiration) {
      const res = NextResponse.redirect(new URL(`/${locale}/login`, req.url));

      // clear auth cookies
      res.cookies.set("next-auth.session-token", "", { maxAge: 0 });
      res.cookies.set("next-auth.csrf-token", "", { maxAge: 0 });
      res.cookies.set("view", "", { maxAge: 0 });

      return res;
    }
  }

  if (!session?.user && !isPublicPage) {
    // Redirect to login page with the current locale
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  // If user is authenticated and trying to access login page, redirect to home
  if (session?.user && isPublicPage) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
