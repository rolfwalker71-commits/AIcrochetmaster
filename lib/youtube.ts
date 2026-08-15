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
  const start = startSec && startSec > 0 ? `?start=${Math.floor(startSec)}` : "";
  return `https://www.youtube.com/embed/${videoId}${start}`;
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
