import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessSecret, sessionToken } from "@/lib/access";
import { NextResponse } from "next/server";

const fails = new Map<string, { count: number; blockedUntil: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export async function POST(request: Request) {
  const secret = accessSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Kein APP_PASSWORD oder APP_PIN gesetzt." },
      { status: 503 },
    );
  }

  const ip = clientKey(request);
  const state = fails.get(ip);
  if (state && state.blockedUntil > Date.now()) {
    return NextResponse.json({ error: "Zu viele Versuche. Kurz warten." }, { status: 429 });
  }

  const body = (await request.json()) as { password?: string };
  const given = (body.password || "").trim();
  if (!given || given !== secret) {
    const next = { count: (state?.count || 0) + 1, blockedUntil: 0 };
    if (next.count >= 5) {
      next.blockedUntil = Date.now() + 30_000;
      next.count = 0;
    }
    fails.set(ip, next);
    return NextResponse.json({ error: "Passwort oder PIN ist falsch." }, { status: 401 });
  }

  fails.delete(ip);
  const token = await sessionToken(secret);
  const secure =
    request.headers.get("x-forwarded-proto") === "https" ||
    new URL(request.url).protocol === "https:";

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return response;
}
