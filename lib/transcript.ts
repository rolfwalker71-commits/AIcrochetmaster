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

const ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "20.10.38",
  androidSdkVersion: 34,
  hl: "de",
  gl: "DE",
};

const IOS_CLIENT = {
  clientName: "IOS",
  clientVersion: "20.10.4",
  hl: "de",
  gl: "DE",
};

async function fetchPlayer(
  videoId: string,
  client: Record<string, unknown>,
): Promise<PlayerResponse> {
  const response = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        client.clientName === "IOS"
          ? "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 17_4 like Mac OS X)"
          : "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
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

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const scored = tracks.map((track) => {
    const lang = (track.languageCode || "").toLowerCase();
    let score = 0;
    if (lang === "de" || lang.startsWith("de-")) score += 30;
    if (lang === "en" || lang.startsWith("en-")) score += 10;
    if (track.kind !== "asr") score += 5;
    return { track, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.track ?? null;
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

function parseXmlTranscript(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const attrs = match[1];
    const start = Number(/start="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const duration = Number(/dur="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const text = decodeEntities(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (text) segments.push({ text, start, duration });
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

async function downloadTrack(baseUrl: string): Promise<TranscriptSegment[]> {
  const urls = [
    `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}fmt=json3`,
    baseUrl,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) continue;
    const body = await response.text();
    if (!body.trim()) continue;
    try {
      if (body.trim().startsWith("{")) {
        const parsed = parseJson3(body);
        if (parsed.length) return parsed;
      }
    } catch {
      // try xml
    }
    const xml = parseXmlTranscript(body);
    if (xml.length) return xml;
  }

  throw new Error("Untertitel-Datei war leer oder unlesbar.");
}

async function tracksFromPlayer(videoId: string): Promise<{
  title: string;
  tracks: CaptionTrack[];
}> {
  const errors: string[] = [];
  for (const client of [ANDROID_CLIENT, IOS_CLIENT]) {
    try {
      const player = await fetchPlayer(videoId, client);
      const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const title = player.videoDetails?.title || "YouTube-Video";
      if (tracks.length) return { title, tracks };
      errors.push(`${client.clientName}: keine Captions`);
    } catch (error) {
      errors.push(`${client.clientName}: ${error instanceof Error ? error.message : "Fehler"}`);
    }
  }
  throw new Error(errors.join(" · "));
}

export async function fetchYoutubeTranscript(videoId: string): Promise<TranscriptResult> {
  const { title, tracks } = await tracksFromPlayer(videoId);
  const track = pickTrack(tracks);
  if (!track?.baseUrl) {
    throw new Error(
      "Für dieses Video gibt es keine Untertitel. Ohne Transkript kann keine Anleitung erzeugt werden.",
    );
  }

  const segments = await downloadTrack(track.baseUrl);
  if (segments.length === 0) {
    throw new Error("Das Transkript war leer.");
  }

  const fullText = segments
    .map((segment) => {
      const m = Math.floor(segment.start / 60);
      const s = Math.floor(segment.start % 60);
      return `[${m}:${String(s).padStart(2, "0")}] ${segment.text}`;
    })
    .join("\n");

  return {
    videoId,
    title,
    language: track.languageCode || "und",
    segments,
    fullText,
  };
}
