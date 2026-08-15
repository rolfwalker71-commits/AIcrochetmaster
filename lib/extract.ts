import { z } from "zod";
import { openAiJson } from "./openai";
import { EXTRACT_SYSTEM, extractUserPrompt, GAP_SYSTEM, gapUserPrompt } from "./prompts";
import type { ExtractedPattern, TextModel, TranscriptResult } from "./types";

const extractedSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["anfänger", "mittel", "fortgeschritten"]),
  estimatedDuration: z.string().optional(),
  abbreviations: z
    .array(
      z.object({
        short: z.string(),
        meaning: z.string(),
        us: z.string().optional(),
        uk: z.string().optional(),
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
        stitchCount: z.number().optional(),
        timestampSec: z.number().optional(),
        colorChange: z.string().optional(),
      }),
    )
    .default([]),
  gaps: z
    .array(
      z.object({
        stepOrder: z.number().optional(),
        reason: z.string(),
        suggestion: z.string().optional(),
      }),
    )
    .default([]),
});

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

function parseContent(content: string): ExtractedPattern {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;
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

  let extracted = await completeJson(
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

  if (extracted.gaps.length > 0) {
    try {
      extracted = await completeJson(
        key,
        model,
        GAP_SYSTEM,
        gapUserPrompt(JSON.stringify(extracted)),
      );
    } catch {
      // keep first pass
    }
  }

  return extracted;
}
