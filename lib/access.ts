export const ACCESS_COOKIE = "acm_session";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

export function accessSecret(): string {
  return (process.env.APP_PASSWORD || process.env.APP_PIN || "").trim();
}

export async function sessionToken(secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${secret}|aicrochetmaster-v1`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function tokensMatch(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}
