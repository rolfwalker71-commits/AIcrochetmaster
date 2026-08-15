const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const URL_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:[^#]*&)?v=)([a-zA-Z0-9_-]{11})/i,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
  /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/i,
  /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
];

export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (ID_RE.test(trimmed)) return trimmed;

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  const urlMatch = trimmed.match(
    /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s]+/i,
  );
  if (urlMatch) {
    for (const pattern of URL_PATTERNS) {
      const match = urlMatch[0].match(pattern);
      if (match?.[1]) return match[1];
    }
  }

  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string, startSec?: number): string {
  const start = Math.max(0, Math.floor(startSec ?? 0));
  const params = new URLSearchParams({
    autoplay: "1",
    start: String(start),
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    fs: "0",
    controls: "0",
    disablekb: "1",
    iv_load_policy: "3",
    playlist: videoId,
    loop: "0",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function parseTimestamp(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  const text = String(value).trim();
  const hms = text.match(/^(\d+):([0-5]?\d):([0-5]\d)$/);
  if (hms) return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
  const ms = text.match(/^(\d+):([0-5]\d)$/);
  if (ms) return Number(ms[1]) * 60 + Number(ms[2]);
  const parsed = Number(text.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
}

export function assignStepTimestamps<
  T extends { instruction: string; roundLabel: string; timestampSec?: number },
>(steps: T[], fullText: string): T[] {
  const lines = fullText.split("\n").flatMap((line) => {
    const match = line.match(/^\[(\d+):(\d{2})(?::(\d{2}))?\]\s*(.*)$/);
    if (!match) return [];
    const sec = match[3]
      ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
      : Number(match[1]) * 60 + Number(match[2]);
    return [{ sec, text: match[4].toLowerCase() }];
  });
  if (lines.length === 0) return steps;

  let cursor = 0;
  return steps.map((step, index) => {
    const existing = parseTimestamp(step.timestampSec);
    if (existing != null && existing > 0) {
      const idx = lines.findIndex((line, lineIndex) => lineIndex >= cursor && line.sec >= existing);
      if (idx >= 0) cursor = idx;
      return existing === step.timestampSec ? step : { ...step, timestampSec: existing };
    }
    const tokens = `${step.roundLabel} ${step.instruction}`
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4)
      .slice(0, 8);
    let best = -1;
    let bestScore = 0;
    const windowEnd = Math.min(lines.length, cursor + 120);
    for (let i = cursor; i < windowEnd; i += 1) {
      const score = tokens.filter((word) => lines[i].text.includes(word)).length;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best >= 0 && bestScore >= 1) {
      cursor = best;
      return { ...step, timestampSec: lines[best].sec };
    }
    const remainingSteps = Math.max(1, steps.length - index);
    const remainingLines = Math.max(1, lines.length - cursor);
    const chosen = Math.min(lines.length - 1, cursor);
    cursor = Math.min(lines.length - 1, cursor + Math.max(1, Math.floor(remainingLines / remainingSteps)));
    return { ...step, timestampSec: lines[chosen].sec };
  });
}

export function formatTimestamp(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return "";
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
