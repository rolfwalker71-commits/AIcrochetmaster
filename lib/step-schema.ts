export type StitchKind = "lm" | "km" | "fm" | "hstb" | "stb" | "dstb" | "inc" | "dec";

export interface StitchToken {
  kind: StitchKind;
  count: number;
}

export interface StepSchema {
  tokens: StitchToken[];
  repeat?: number;
  layout: "round" | "row";
  total?: number;
}

const KINDS: { kind: StitchKind; re: RegExp }[] = [
  { kind: "inc", re: /zunahmen?|zunehmen|\binc\b|\bzun\b/i },
  { kind: "dec", re: /abnahmen?|abnehmen|\bdec\b|\babn\b|unsichtbar/i },
  { kind: "dstb", re: /doppelstäbchen|\bdstb\b|\btr\b/i },
  { kind: "hstb", re: /halbe[sn]? stäbchen|\bhstb\b|\bhdc\b/i },
  { kind: "stb", re: /stäbchen|\bstb\b|\bdc\b/i },
  { kind: "fm", re: /feste[n]? maschen?|\bfm\b|\bsc\b/i },
  { kind: "lm", re: /luftmaschen?(kette)?|\blm\b|\bch\b/i },
  { kind: "km", re: /kettmaschen?|\bkm\b|slst|slip/i },
];

export const STITCH_LABEL: Record<StitchKind, string> = {
  lm: "Lm",
  km: "Km",
  fm: "fm",
  hstb: "hStb",
  stb: "Stb",
  dstb: "Dstb",
  inc: "Zun",
  dec: "Abn",
};

function detectKind(text: string): StitchKind | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("halbes stäbchen") || lower.includes("halbe stäbchen")) return "hstb";
  if (lower.includes("doppelstäbchen")) return "dstb";
  return KINDS.find((item) => item.re.test(text))?.kind;
}

function parsePart(part: string): StitchToken | undefined {
  const kind = detectKind(part);
  if (!kind) return undefined;
  const count = part.match(/(\d{1,3})/);
  return { kind, count: count ? Math.min(48, Number(count[1])) : 1 };
}

function parseSequence(text: string): StitchToken[] {
  return text
    .split(/,| und | dann |;|\n| · |\+/i)
    .map((part) => parsePart(part.trim()))
    .filter((item): item is StitchToken => Boolean(item));
}

export function parseStepSchema(
  instruction: string,
  stitchCount?: number,
  roundLabel?: string,
): StepSchema | undefined {
  const text = instruction.trim();
  if (!text) return undefined;
  const layout = /reihe/i.test(`${roundLabel ?? ""} ${text}`) ? "row" : "round";

  const grouped =
    text.match(/\(([^)]+)\)\s*(?:×|x|\*|mal)\s*(\d{1,2})/i) ??
    text.match(/\(([^)]+)\)\s*(\d{1,2})\s*[- ]?mal/i);
  if (grouped) {
    const tokens = parseSequence(grouped[1]);
    if (tokens.length > 0) {
      return { tokens, repeat: Number(grouped[2]), layout, total: stitchCount };
    }
  }

  const tokens = parseSequence(text);
  if (tokens.length > 0) {
    return { tokens, layout, total: stitchCount };
  }

  const kind = detectKind(text);
  if (!kind) return undefined;
  return {
    tokens: [{ kind, count: stitchCount && stitchCount > 0 ? Math.min(48, stitchCount) : 1 }],
    layout,
    total: stitchCount,
  };
}

export function expandSchemaMarks(schema: StepSchema, limit = 18): StitchKind[] {
  const unit = schema.tokens.flatMap((token) => Array.from({ length: token.count }, () => token.kind));
  const times = schema.repeat ?? 1;
  const expanded = Array.from({ length: times }, () => unit).flat();
  if (expanded.length <= limit) return expanded;
  if (unit.length > 0 && unit.length <= limit) return unit;
  return expanded.slice(0, limit);
}
