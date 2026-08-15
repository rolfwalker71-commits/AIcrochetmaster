import { ACCESS_COOKIE, accessSecret, sessionToken, tokensMatch } from "@/lib/access";
import { publicOrigin } from "@/lib/public-url";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = new Set([
  "/login",
  "/api/login",
  "/api/logout",
  "/api/health",
  "/api/access",
  "/api/session",
  "/icon",
  "/apple-icon",
  "/manifest.webmanifest",
  "/sw.js",
]);

function isPublic(pathname: string): boolean {
  return (
    PUBLIC.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/")
  );
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const next = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const location = `/login?next=${encodeURIComponent(next)}`;
  const origin = publicOrigin(request.headers, request.url);
  if (origin) {
    return NextResponse.redirect(new URL(location, origin));
  }
  return new NextResponse(null, {
    status: 307,
    headers: { Location: location },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const secret = accessSecret();
  if (!secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }
    return redirectToLogin(request, pathname);
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value || "";
  if (token && tokensMatch(token, await sessionToken(secret))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  return redirectToLogin(request, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
