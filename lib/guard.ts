import { ACCESS_COOKIE, accessSecret, sessionToken, tokensMatch } from "@/lib/access";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function hasValidSession(): Promise<boolean> {
  const secret = accessSecret();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value || "";
  if (!token) return false;
  return tokensMatch(token, await sessionToken(secret));
}

export async function requirePageAccess(): Promise<void> {
  if (await hasValidSession()) return;
  redirect("/login");
}

export async function requireApiAccess(): Promise<Response | null> {
  if (await hasValidSession()) return null;
  return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
}
