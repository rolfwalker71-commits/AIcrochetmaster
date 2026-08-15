import { ACCESS_COOKIE, accessSecret, sessionToken, tokensMatch } from "@/lib/access";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = accessSecret();
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, open: true });
    }
    return NextResponse.json({ ok: false, configured: false }, { status: 401 });
  }

  const token = (await cookies()).get(ACCESS_COOKIE)?.value || "";
  const expected = await sessionToken(secret);
  if (token && tokensMatch(token, expected)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
