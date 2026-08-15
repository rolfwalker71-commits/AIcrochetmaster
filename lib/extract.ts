import { z } from "zod";
import { openAiJson } from "./openai";
import { EXTRACT_SYSTEM, PDF_EXTRACT_SYSTEM, extractPdfUserPrompt, extractUserPrompt } from "./prompts";
import type { ExtractedPattern, TextModel, TranscriptResult } from "./types";

const optionalString = z.string().nullish().transform((value) => value ?? undefined);
const optionalNumber = z.number().nullish().transform((value) => value ?? undefined);
const optionalBoolean = z.boolean().nullish().transform((value) => value ?? undefined);

const extractedSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["anfänger", "mittel", "fortgeschritten"]),
  estimatedDuration: optionalString,
  abbreviations: z
    .array(
      z.object({
        short: z.string(),
        meaning: z.string(),
        us: optionalString,
        uk: optionalString,
      }),
    )
    .default([]),
  motifTags: z.array(z.string()).default([]),
  materials: z
    .array(z.object({ name: z.string(), quantity: z.string() }))
    .default([]),
  steps: z
    .array(
      z.object({
        roundLabel: z.string(),
        instruction: z.string(),
        stitchCount: optionalNumber,
        timestampSec: optionalNumber,
        colorChange: optionalString,
        uncertain: optionalBoolean,
      }),
    )
    .default([]),
  gaps: z
    .array(
      z.object({
        stepOrder: optionalNumber,
        reason: z.string(),
        suggestion: optionalString,
      }),
    )
    .default([]),
});

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

function stripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripNulls(item)]));
  }
  return value;
}

function parseContent(content: string): ExtractedPattern {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = stripNulls(JSON.parse(cleaned) as unknown);
  return extractedSchema.parse(parsed);
}

async function completeJson(
  key: string,
  model: TextModel,
  system: string,
  user: string,
): Promise<ExtractedPattern> {
  const data = await openAiJson<ChatCompletion>(key, "chat/completions", {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Das Modell hat keine Anleitung geliefert.");
  return parseContent(content);
}

const MAX_TRANSCRIPT_CHARS = 90000;

export async function extractPatternFromTranscript(
  key: string,
  model: TextModel,
  transcript: TranscriptResult,
): Promise<ExtractedPattern> {
  const text =
    transcript.fullText.length > MAX_TRANSCRIPT_CHARS
      ? `${transcript.fullText.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[Transkript gekürzt]`
      : transcript.fullText;

  const extracted = await completeJson(
    key,
    model,
    EXTRACT_SYSTEM,
    extractUserPrompt({
      videoTitle: transcript.title,
      language: transcript.language,
      transcript: text,
    }),
  );

  if (extracted.steps.length === 0) {
    throw new Error("Es konnten keine Häkel-Schritte erkannt werden.");
  }

  return extracted;
}

interface ResponsesResult {
  output_text?: string;
  output?: { content?: { type?: string; text?: string }[] }[];
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
): Promise<ExtractedPattern> {
  const fileData = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`;
  const data = await openAiJson<ResponsesResult>(key, "responses", {
    model,
    temperature: 0.2,
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
  const content = textFromResponses(data);
  if (!content) throw new Error("Das Modell hat keine Anleitung aus dem PDF geliefert.");
  const extracted = parseContent(content);
  extracted.steps = expandCombinedPdfSteps(extracted.steps);
  if (extracted.steps.length === 0) {
    throw new Error("Es konnten keine Häkel-Schritte im PDF erkannt werden.");
  }
  return extracted;
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

export function expandCombinedPdfSteps(
  steps: ExtractedPattern["steps"],
): ExtractedPattern["steps"] {
  return steps.flatMap((step) => splitRoundList(step)).flatMap((step) => expandRangeStep(step));
}
