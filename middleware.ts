import { ACCESS_COOKIE } from "@/lib/access";
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    PUBLIC.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (request.cookies.get(ACCESS_COOKIE)?.value) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
