import { auth0 } from "@/lib/auth0";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth middleware for auth0 callback routes
  if (pathname.startsWith("/auth/")) {
    return await auth0.middleware(request);
  }

  // Apply i18n middleware first for non-API routes
  if (!pathname.startsWith("/api")) {
    const intlResponse = intlMiddleware(request);
    if (intlResponse) {
      return intlResponse;
    }
  }

  // Apply auth0 middleware
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public files (files with extensions)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*$).*)",
  ],
};
