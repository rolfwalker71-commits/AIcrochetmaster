import { openAiJson } from "./openai";
import {
  EXTRACT_SYSTEM,
  PDF_EXTRACT_SYSTEM,
  extractChunkUserPrompt,
  extractPdfUserPrompt,
  extractRetryUserPrompt,
  extractUserPrompt,
} from "./prompts";
import type { Difficulty, ExtractedPattern, TextModel, TranscriptResult } from "./types";
import { addUsageFromResponse, emptyUsage, type AnalysisUsage } from "./usage";
import { assignStepTimestamps, parseTimestamp } from "./youtube";

export interface ExtractResult {
  extraction: ExtractedPattern;
  usage: AnalysisUsage;
}

interface ChatCompletion {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function asNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asBool(value: unknown): boolean | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).toLowerCase().trim();
  if (["true", "ja", "yes", "1"].includes(text)) return true;
  if (["false", "nein", "no", "0"].includes(text)) return false;
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function repairTruncatedJson(text: string): string {
  let source = text.trim().replace(/,?\s*"[^"\\]*$/, "").replace(/,\s*$/, "");
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  for (const char of source) {
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") stack.push("}");
    else if (char === "[") stack.push("]");
    else if (char === "}" || char === "]") stack.pop();
  }
  if (inString) source += '"';
  source = source.replace(/,\s*$/, "");
  while (stack.length > 0) source += stack.pop();
  return source;
}

function parseJsonLoose(content: string): unknown {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const body = start >= 0 ? cleaned.slice(start) : cleaned;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return JSON.parse(repairTruncatedJson(body)) as unknown;
  }
}

function normalizeExtracted(raw: unknown): ExtractedPattern {
  const obj = asRecord(raw);
  let abbreviations = asList(obj.abbreviations).flatMap((item) => {
    const rec = asRecord(item);
    const short = asText(rec.short ?? rec.abbr);
    const meaning = asText(rec.meaning ?? rec.de);
    return short && meaning
      ? [{ short, meaning, us: asText(rec.us) || undefined, uk: asText(rec.uk) || undefined }]
      : [];
  });
  if (abbreviations.length === 0 && obj.abbreviations && !Array.isArray(obj.abbreviations)) {
    abbreviations = Object.entries(asRecord(obj.abbreviations)).flatMap(([short, meaning]) => {
      const text = asText(meaning);
      return text ? [{ short, meaning: text, us: undefined, uk: undefined }] : [];
    });
  }
  const difficultyText = asText(obj.difficulty).toLowerCase();
  const difficulty: Difficulty = /(anfänger|beginner|leicht|easy)/.test(difficultyText)
    ? "anfänger"
    : /(fortgeschritten|advanced|schwer|hard)/.test(difficultyText)
      ? "fortgeschritten"
      : "mittel";

  return {
    title: asText(obj.title) || "Ohne Titel",
    description: asText(obj.description),
    difficulty,
    estimatedDuration: asText(obj.estimatedDuration) || undefined,
    abbreviations,
    motifTags: asList(obj.motifTags).flatMap((tag) =>
      asText(tag)
        .split(/[,;]/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
    materials: asList(obj.materials).flatMap((item) => {
      const rec = asRecord(item);
      const name = asText(rec.name ?? rec.material ?? (typeof item === "string" ? item : ""));
      return name ? [{ name, quantity: asText(rec.quantity ?? rec.menge) }] : [];
    }),
    steps: asList(obj.steps).flatMap((item) => {
      const rec = asRecord(item);
      const instruction = asText(rec.instruction ?? rec.text ?? rec.anweisung);
      if (!instruction) return [];
      return [
        {
          roundLabel: asText(rec.roundLabel ?? rec.label ?? rec.title) || "Schritt",
          instruction,
          stitchCount: asNumber(rec.stitchCount),
          timestampSec: parseTimestamp(rec.timestampSec ?? rec.timestamp),
          colorChange: asText(rec.colorChange) || undefined,
          uncertain: asBool(rec.uncertain),
          pdfPage: (() => {
            const page = asNumber(rec.pdfPage ?? rec.page);
            return page && page >= 1 ? Math.floor(page) : undefined;
          })(),
          imageHint: asText(rec.imageHint ?? rec.image) || undefined,
        },
      ];
    }),
    gaps: asList(obj.gaps).flatMap((item) => {
      const rec = asRecord(item);
      const reason = asText(rec.reason ?? rec.text);
      return reason
        ? [
            {
              stepOrder: asNumber(rec.stepOrder),
              reason,
              suggestion: asText(rec.suggestion) || undefined,
            },
          ]
        : [];
    }),
  };
}

function parseContent(content: string): ExtractedPattern {
  try {
    return normalizeExtracted(parseJsonLoose(content));
  } catch {
    throw new Error("Die extrahierte Anleitung war unvollständig. Bitte noch einmal versuchen.");
  }
}

async function completeJson(
  key: string,
  model: TextModel,
  system: string,
  user: string,
  usage: AnalysisUsage,
): Promise<ExtractedPattern> {
  const data = await openAiJson<ChatCompletion>(key, "chat/completions", {
    model,
    temperature: 0.2,
    max_tokens: 16384,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  addUsageFromResponse(usage, data);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Das Modell hat keine Anleitung geliefert.");
  return parseContent(content);
}

const MAX_TRANSCRIPT_CHARS = 90000;
const CHUNK_CHARS = 9000;
const SUMMARY_STEP_LIMIT = 8;

function transcriptText(transcript: TranscriptResult): string {
  return transcript.fullText.length > MAX_TRANSCRIPT_CHARS
    ? `${transcript.fullText.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[Transkript gekürzt]`
    : transcript.fullText;
}

function chunkTranscriptText(text: string): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current: string[] = [];
  let length = 0;
  for (const line of lines) {
    if (current.length > 0 && length + line.length + 1 > CHUNK_CHARS) {
      chunks.push(current.join("\n"));
      const overlap = current.slice(-8);
      current = [...overlap, line];
      length = current.join("\n").length;
    } else {
      current.push(line);
      length += line.length + 1;
    }
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}

function looksLikeSummary(steps: ExtractedPattern["steps"], sourceChars: number): boolean {
  if (steps.length === 0) return true;
  if (sourceChars >= 8000 && steps.length < SUMMARY_STEP_LIMIT) return true;
  const coarse = steps.filter((step) => {
    const text = `${step.roundLabel} ${step.instruction}`;
    return (
      step.instruction.length > 220 ||
      /im Wechsel|gewünschte Höhe|bis zur Höhe|zusammenfassen/i.test(text)
    );
  });
  return steps.length < SUMMARY_STEP_LIMIT && coarse.length >= Math.max(1, steps.length - 1);
}

function similarStep(
  a: ExtractedPattern["steps"][number],
  b: ExtractedPattern["steps"][number],
): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
  const left = normalize(a.instruction).slice(0, 120);
  const right = normalize(b.instruction).slice(0, 120);
  if (!left || !right) return false;
  return left === right || (left.length > 40 && (left.includes(right) || right.includes(left)));
}

function mergeExtractions(parts: ExtractedPattern[]): ExtractedPattern {
  if (parts.length === 0) {
    throw new Error("Es konnten keine Amigurumi-Schritte erkannt werden.");
  }
  const [first, ...rest] = parts;
  const steps = expandCombinedSteps(
    parts.flatMap((part) => part.steps).reduce<ExtractedPattern["steps"]>((list, step) => {
      const last = list[list.length - 1];
      if (last && similarStep(last, step)) return list;
      list.push(step);
      return list;
    }, []),
  );
  const materials = [...first.materials];
  for (const part of rest) {
    for (const material of part.materials) {
      if (!materials.some((item) => item.name.toLowerCase() === material.name.toLowerCase())) {
        materials.push(material);
      }
    }
  }
  const abbreviations = [...first.abbreviations];
  for (const part of rest) {
    for (const item of part.abbreviations) {
      if (!abbreviations.some((entry) => entry.short.toLowerCase() === item.short.toLowerCase())) {
        abbreviations.push(item);
      }
    }
  }
  return {
    ...first,
    materials,
    abbreviations,
    motifTags: [...new Set(parts.flatMap((part) => part.motifTags))],
    steps,
    gaps: parts.flatMap((part) => part.gaps),
  };
}

export async function extractPatternFromTranscript(
  key: string,
  model: TextModel,
  transcript: TranscriptResult,
): Promise<ExtractResult> {
  const usage = emptyUsage(model);
  const text = transcriptText(transcript);
  const chunks = chunkTranscriptText(text);
  const parts: ExtractedPattern[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const previousSteps = parts.at(-1)?.steps.slice(-3) ?? [];
    const user =
      chunks.length === 1
        ? extractUserPrompt({
            videoTitle: transcript.title,
            language: transcript.language,
            transcript: chunks[0],
          })
        : extractChunkUserPrompt({
            videoTitle: transcript.title,
            language: transcript.language,
            transcript: chunks[index],
            part: index + 1,
            parts: chunks.length,
            previousSteps,
          });
    let part: ExtractedPattern | undefined;
    try {
      part = await completeJson(key, model, EXTRACT_SYSTEM, user, usage);
    } catch {
      try {
        part = await completeJson(
          key,
          model,
          EXTRACT_SYSTEM,
          `${user}\n\n${extractRetryUserPrompt(0)}`,
          usage,
        );
      } catch {
        continue;
      }
    }
    if (chunks.length > 1 && looksLikeSummary(part.steps, chunks[index].length)) {
      try {
        const again = await completeJson(
          key,
          model,
          EXTRACT_SYSTEM,
          `${user}\n\n${extractRetryUserPrompt(part.steps.length)}`,
          usage,
        );
        if (again.steps.length >= part.steps.length) part = again;
      } catch {
        // keep the first successful part
      }
    }
    parts.push(part);
  }

  let extracted = mergeExtractions(parts);
  if (looksLikeSummary(extracted.steps, text.length) && chunks.length === 1) {
    extracted = await completeJson(
      key,
      model,
      EXTRACT_SYSTEM,
      `${extractUserPrompt({
        videoTitle: transcript.title,
        language: transcript.language,
        transcript: text,
      })}\n\n${extractRetryUserPrompt(extracted.steps.length)}`,
      usage,
    );
    extracted.steps = expandCombinedSteps(extracted.steps);
  }

  if (extracted.steps.length === 0) {
    throw new Error("Es konnten keine Amigurumi-Schritte erkannt werden.");
  }

  extracted.steps = assignStepTimestamps(extracted.steps, text);
  return { extraction: extracted, usage };
}

interface ResponsesResult {
  output_text?: string;
  output?: { content?: { type?: string; text?: string }[] }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

function textFromResponses(data: ResponsesResult): string {
  if (data.output_text?.trim()) return data.output_text;
  const parts = data.output?.flatMap((item) => item.content ?? []) ?? [];
  const text = parts
    .filter((part) => part.type === "output_text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
  return text;
}

export async function extractPatternFromPdf(
  key: string,
  model: TextModel,
  fileName: string,
  pdfBytes: Uint8Array,
): Promise<ExtractResult> {
  const usage = emptyUsage(model);
  const fileData = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`;
  const data = await openAiJson<ResponsesResult>(key, "responses", {
    model,
    temperature: 0.2,
    max_output_tokens: 16384,
    store: false,
    text: { format: { type: "json_object" } },
    input: [
      { role: "system", content: PDF_EXTRACT_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: fileName,
            file_data: fileData,
            detail: "high",
          },
          { type: "input_text", text: extractPdfUserPrompt(fileName) },
        ],
      },
    ],
  });
  addUsageFromResponse(usage, data);
  const content = textFromResponses(data);
  if (!content) throw new Error("Das Modell hat keine Anleitung aus dem PDF geliefert.");
  let extracted = parseContent(content);
  extracted.steps = expandCombinedSteps(extracted.steps);

  if (looksLikeSummary(extracted.steps, 12000)) {
    const retry = await openAiJson<ResponsesResult>(key, "responses", {
      model,
      temperature: 0.2,
      max_output_tokens: 16384,
      store: false,
      text: { format: { type: "json_object" } },
      input: [
        { role: "system", content: PDF_EXTRACT_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: fileName,
              file_data: fileData,
              detail: "high",
            },
            {
              type: "input_text",
              text: `${extractPdfUserPrompt(fileName)}\n\n${extractRetryUserPrompt(extracted.steps.length)}`,
            },
          ],
        },
      ],
    });
    addUsageFromResponse(usage, retry);
    const retryContent = textFromResponses(retry);
    if (retryContent) {
      const again = parseContent(retryContent);
      again.steps = expandCombinedSteps(again.steps);
      if (again.steps.length > extracted.steps.length) extracted = again;
    }
  }

  if (extracted.steps.length === 0) {
    throw new Error("Es konnten keine Amigurumi-Schritte im PDF erkannt werden.");
  }
  return { extraction: extracted, usage };
}

const RANGE_RE =
  /(?:Runden?|Reihen?|Rd\.?|rounds?|rows?|ряд(?:ы|а)?|ряды)\s*(\d+)\s*(?:[-–—]|bis|to|до)\s*(\d+)/i;
const ROUND_LINE_RE =
  /(?:^|[;\n•·]|,\s*)(?:Runde|Reihe|Rd\.?|round|row|ряд)\s*(\d+)\s*[:.\-–—)]\s*/gi;

function partPrefix(label: string): string {
  const cleaned = label.replace(RANGE_RE, "").replace(/\s*[·\-–—:]\s*$/, "").trim();
  const cut = cleaned.search(/\b(?:Runde|Reihe|Rd\.?|round|row|ряд)\b/i);
  if (cut <= 0) return "";
  return cleaned.slice(0, cut).replace(/\s*[·\-–—:]\s*$/, "").trim();
}

function labeledRound(part: string, n: number): string {
  return part ? `${part} · Runde ${n}` : `Runde ${n}`;
}

function expandRangeStep(step: ExtractedPattern["steps"][number]): ExtractedPattern["steps"] {
  const fromLabel = step.roundLabel.match(RANGE_RE);
  const fromText = !fromLabel ? step.instruction.match(RANGE_RE) : null;
  const match = fromLabel ?? fromText;
  if (!match) return [step];
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 40) {
    return [step];
  }
  const part = partPrefix(step.roundLabel);
  const instruction = step.instruction.replace(RANGE_RE, "").replace(/^\s*[:.\-–—]\s*/, "").trim() || step.instruction;
  return Array.from({ length: end - start + 1 }, (_, index) => ({
    ...step,
    roundLabel: labeledRound(part, start + index),
    instruction,
  }));
}

function splitRoundList(step: ExtractedPattern["steps"][number]): ExtractedPattern["steps"] {
  const matches = [...step.instruction.matchAll(new RegExp(ROUND_LINE_RE.source, "gi"))];
  if (matches.length < 2) return [step];
  const part = partPrefix(step.roundLabel);
  const pieces: ExtractedPattern["steps"] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const start = (current.index ?? 0) + current[0].length;
    const stop = next?.index ?? step.instruction.length;
    const instruction = step.instruction.slice(start, stop).replace(/^[;\n•·,\s]+|[;\n•·,\s]+$/g, "").trim();
    if (!instruction) continue;
    pieces.push({
      ...step,
      roundLabel: labeledRound(part, Number(current[1])),
      instruction,
      stitchCount: undefined,
    });
  }
  return pieces.length > 1 ? pieces : [step];
}

export function expandCombinedSteps(
  steps: ExtractedPattern["steps"],
): ExtractedPattern["steps"] {
  return steps.flatMap((step) => splitRoundList(step)).flatMap((step) => expandRangeStep(step));
}

export const expandCombinedPdfSteps = expandCombinedSteps;
