import { ACCESS_COOKIE, accessSecret, sessionToken, tokensMatch } from "@/lib/access";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export async function hasValidSession(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = accessSecret();
  if (!secret) {
    return false;
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value || "";
  if (!token) return false;
  return tokensMatch(token, await sessionToken(secret));
}

export async function requirePageAccess(): Promise<void> {
  await connection();
  if (await hasValidSession()) return;
  redirect("/login");
}

export async function requireApiAccess(): Promise<Response | null> {
  if (await hasValidSession()) return null;
  return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
}
