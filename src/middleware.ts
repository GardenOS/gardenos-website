import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
]);

function getCanonicalHost(): string {
  const configured = process.env.CANONICAL_HOST?.trim().toLowerCase();
  if (configured) return configured;
  return "";
}

export default clerkMiddleware(async (auth, req) => {
  const canonicalHost = getCanonicalHost();
  if (canonicalHost) {
    const hostHeader = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
    const host = hostHeader.split(":")[0] ?? "";
    const wwwHost = `www.${canonicalHost}`;

    if (host === wwwHost) {
      const url = req.nextUrl.clone();
      url.host = canonicalHost;
      url.protocol = "https";
      return NextResponse.redirect(url, 308);
    }
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
