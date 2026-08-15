import type { TranscriptResult, TranscriptSegment } from "./types";

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  name?: { simpleText?: string };
  kind?: string;
}

interface PlayerResponse {
  videoDetails?: { title?: string; videoId?: string };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

const CLIENTS: { client: Record<string, unknown>; userAgent: string }[] = [
  {
    client: {
      clientName: "IOS",
      clientVersion: "20.10.4",
      hl: "de",
      gl: "DE",
    },
    userAgent: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 17_4 like Mac OS X)",
  },
  {
    client: {
      clientName: "ANDROID",
      clientVersion: "20.10.38",
      androidSdkVersion: 34,
      hl: "de",
      gl: "DE",
    },
    userAgent: "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
  },
  {
    client: {
      clientName: "TVHTML5",
      clientVersion: "7.20250313.13.00",
      hl: "de",
      gl: "DE",
    },
    userAgent: "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version",
  },
];

async function fetchPlayer(
  videoId: string,
  client: Record<string, unknown>,
  userAgent: string,
): Promise<PlayerResponse> {
  const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
    body: JSON.stringify({
      context: { client },
      videoId,
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube Player-API ${response.status}`);
  }
  return (await response.json()) as PlayerResponse;
}

function scoreTrack(track: CaptionTrack): number {
  const lang = (track.languageCode || "").toLowerCase();
  let score = 0;
  if (lang === "de" || lang.startsWith("de-")) score += 40;
  if (lang === "en" || lang.startsWith("en-")) score += 10;
  if (track.kind !== "asr") score += 5;
  return score;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function cleanCaptionText(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseClassicXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const attrs = match[1];
    const start = Number(/start="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const duration = Number(/dur="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const text = cleanCaptionText(match[2]);
    if (text) segments.push({ text, start, duration });
  }
  return segments;
}

function parseTimedTextV3(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const attrs = match[1];
    const startMs = Number(/\bt="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const durationMs = Number(/\bd="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const text = cleanCaptionText(match[2]);
    if (!text) continue;
    segments.push({
      text,
      start: startMs / 1000,
      duration: durationMs / 1000,
    });
  }
  return segments;
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: { utf8?: string }[];
}

function parseJson3(json: string): TranscriptSegment[] {
  const data = JSON.parse(json) as { events?: Json3Event[] };
  const segments: TranscriptSegment[] = [];
  for (const event of data.events || []) {
    const text = (event.segs || [])
      .map((seg) => seg.utf8 || "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text === "\n") continue;
    segments.push({
      text,
      start: (event.tStartMs || 0) / 1000,
      duration: (event.dDurationMs || 0) / 1000,
    });
  }
  return segments;
}

function parseTranscriptBody(body: string): TranscriptSegment[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{")) {
    try {
      const json = parseJson3(trimmed);
      if (json.length) return json;
    } catch {
      // fall through to XML
    }
  }

  if (trimmed.includes("<timedtext") || /<p\b/.test(trimmed)) {
    const v3 = parseTimedTextV3(trimmed);
    if (v3.length) return v3;
  }

  return parseClassicXml(trimmed);
}

function withParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function downloadTrack(
  baseUrl: string,
  languageCode: string,
  userAgent: string,
): Promise<TranscriptSegment[]> {
  const lang = languageCode.toLowerCase();
  const wantGerman = !lang.startsWith("de");
  const variants: string[] = [];

  if (wantGerman) {
    variants.push(withParams(baseUrl, { tlang: "de", fmt: "srv3" }));
    variants.push(withParams(baseUrl, { tlang: "de" }));
    variants.push(withParams(baseUrl, { tlang: "de", fmt: "json3" }));
  }
  variants.push(withParams(baseUrl, { fmt: "json3" }));
  variants.push(withParams(baseUrl, { fmt: "srv3" }));
  variants.push(baseUrl);

  for (const url of variants) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent },
      });
      if (!response.ok) continue;
      const parsed = parseTranscriptBody(await response.text());
      if (parsed.length) return parsed;
    } catch {
      // try next variant
    }
  }

  return [];
}

async function collectTracks(videoId: string): Promise<{
  title: string;
  attempts: { track: CaptionTrack; userAgent: string }[];
}> {
  let title = "YouTube-Video";
  const attempts: { track: CaptionTrack; userAgent: string }[] = [];
  const seen = new Set<string>();

  for (const { client, userAgent } of CLIENTS) {
    try {
      const player = await fetchPlayer(videoId, client, userAgent);
      title = player.videoDetails?.title || title;
      const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const sorted = [...tracks].sort((a, b) => scoreTrack(b) - scoreTrack(a));
      for (const track of sorted) {
        if (!track.baseUrl || seen.has(track.baseUrl)) continue;
        seen.add(track.baseUrl);
        attempts.push({ track, userAgent });
      }
    } catch {
      // next client
    }
  }

  return { title, attempts };
}

export async function fetchYoutubeTranscript(videoId: string): Promise<TranscriptResult> {
  const { title, attempts } = await collectTracks(videoId);
  if (attempts.length === 0) {
    throw new Error(
      "Für dieses Video gibt es kein Transkript. Ohne Transkript kann keine Anleitung erzeugt werden.",
    );
  }

  for (const { track, userAgent } of attempts) {
    const segments = await downloadTrack(track.baseUrl || "", track.languageCode || "", userAgent);
    if (segments.length === 0) continue;

    const fullText = segments
      .map((segment) => {
        const m = Math.floor(segment.start / 60);
        const s = Math.floor(segment.start % 60);
        return `[${m}:${String(s).padStart(2, "0")}] ${segment.text}`;
      })
      .join("\n");

    const originalLang = track.languageCode || "und";
    return {
      videoId,
      title,
      language: originalLang.toLowerCase().startsWith("de") ? originalLang : "de",
      segments,
      fullText,
    };
  }

  throw new Error("Das Transkript konnte nicht gelesen werden. Bitte einen anderen Link versuchen.");
}
