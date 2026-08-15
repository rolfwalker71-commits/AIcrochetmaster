import type { ImageModel, TextModel } from "./types";

export interface AnalysisUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  usd: number;
  imageUsd?: number;
  estimated?: boolean;
}

const TEXT_RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

const IMAGE_USD: Record<ImageModel, number> = {
  "gpt-image-1": 0.011,
  "dall-e-3": 0.04,
};

export function emptyUsage(model: string): AnalysisUsage {
  return { model, inputTokens: 0, outputTokens: 0, calls: 0, usd: 0 };
}

export function addUsageFromResponse(usage: AnalysisUsage, data: unknown): void {
  const raw = (data as { usage?: Record<string, number> } | null)?.usage;
  if (!raw) return;
  usage.inputTokens += raw.prompt_tokens ?? raw.input_tokens ?? 0;
  usage.outputTokens += raw.completion_tokens ?? raw.output_tokens ?? 0;
  usage.calls += 1;
  usage.usd = estimateTextUsd(usage.model, usage.inputTokens, usage.outputTokens);
}

export function estimateTextUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rates = TEXT_RATES[model] ?? TEXT_RATES["gpt-4o"];
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

export function imageUsd(model: ImageModel): number {
  return IMAGE_USD[model] ?? 0.04;
}

export function estimateFromTranscript(model: TextModel, charCount: number): AnalysisUsage {
  const chunks = Math.max(1, Math.ceil(charCount / 9000));
  const inputTokens = Math.round((charCount + 2800 * chunks) / 4);
  const outputTokens = 2800 * chunks;
  return {
    model,
    inputTokens,
    outputTokens,
    calls: chunks,
    usd: estimateTextUsd(model, inputTokens, outputTokens),
    estimated: true,
  };
}

export function estimateFromPdf(model: TextModel, bytes: number): AnalysisUsage {
  const inputTokens = Math.max(4000, Math.round(bytes / 8));
  const outputTokens = 4000;
  return {
    model,
    inputTokens,
    outputTokens,
    calls: 1,
    usd: estimateTextUsd(model, inputTokens, outputTokens),
    estimated: true,
  };
}

export function formatTokenCount(value: number): string {
  return new Intl.NumberFormat("de-DE").format(Math.max(0, Math.round(value)));
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function totalUsd(usage: AnalysisUsage): number {
  return usage.usd + (usage.imageUsd ?? 0);
}
