export function forwardedProto(headers: Headers): string | null {
  return headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || null;
}

export function forwardedHost(headers: Headers): string | null {
  const host =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headers.get("host")?.split(",")[0]?.trim() ||
    null;
  if (!host || host.startsWith("0.0.0.0")) return null;
  return host;
}

export function requestIsHttps(headers: Headers, fallbackUrl?: string): boolean {
  const proto = forwardedProto(headers);
  if (proto) return proto === "https";
  if (!fallbackUrl) return false;
  try {
    return new URL(fallbackUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function publicOrigin(headers: Headers, fallbackUrl?: string): string | null {
  const host = forwardedHost(headers);
  if (!host) return null;
  const proto = forwardedProto(headers) || (requestIsHttps(headers, fallbackUrl) ? "https" : "http");
  return `${proto}://${host}`;
}
