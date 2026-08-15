import { ACCESS_COOKIE } from "@/lib/access";
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
  "/ok.html",
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
  const response = origin
    ? NextResponse.redirect(new URL(location, origin))
    : new NextResponse(null, {
        status: 307,
        headers: { Location: location },
      });
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Only look at cookie presence here. The PIN itself is checked in Node
  // (login + layout), because proxy would freeze an empty APP_PIN at image build.
  if (request.cookies.get(ACCESS_COOKIE)?.value) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  return redirectToLogin(request, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/login|api/logout|api/access|api/health|api/session).*)",
  ],
};
