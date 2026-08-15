import { z } from "zod";
import { openAiJson } from "./openai";
import { EXTRACT_SYSTEM, extractUserPrompt } from "./prompts";
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
