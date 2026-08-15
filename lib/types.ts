export type PatternStatus = "inbox" | "in_progress" | "done";
export type PatternSource = "youtube" | "pdf";
export type Difficulty = "anfänger" | "mittel" | "fortgeschritten";
export type TextModel = "gpt-4o" | "gpt-4.1" | "gpt-4o-mini";
export type ImageModel = "gpt-image-1" | "dall-e-3";

export interface Abbreviation {
  short: string;
  meaning: string;
  us?: string;
  uk?: string;
}

export interface Gap {
  stepOrder?: number;
  reason: string;
  suggestion?: string;
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  videoId: string;
  source?: PatternSource;
  sourceName?: string;
  headerImage?: string;
  difficulty: Difficulty;
  estimatedDuration?: string;
  status: PatternStatus;
  abbreviations: Abbreviation[];
  motifTags: string[];
  gaps: Gap[];
  analysisUsage?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    calls: number;
    usd: number;
    imageUsd?: number;
    estimated?: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Step {
  id: string;
  patternId: string;
  order: number;
  roundLabel: string;
  instruction: string;
  stitchCount?: number;
  timestampSec?: number;
  colorChange?: string;
  uncertain?: boolean;
  pdfPage?: number;
  imageHint?: string;
  imageDataUrl?: string;
  done: boolean;
  note: string;
}

export interface Material {
  id: string;
  patternId: string;
  name: string;
  quantity: string;
  done: boolean;
}

export interface Progress {
  patternId: string;
  currentStepIndex: number;
  rowCounter: number;
  rowCounterVisible: boolean;
}

export interface Settings {
  id: "settings";
  openaiKey: string;
  textModel: TextModel;
  imageModel: ImageModel;
  showRowCounter: boolean;
  largeText: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  openaiKey: "",
  textModel: "gpt-4o",
  imageModel: "gpt-image-1",
  showRowCounter: true,
  largeText: false,
};

export interface MotifCard {
  id: string;
  title: string;
  category: string;
  summary: string;
  steps: string[];
  stitchHint?: string;
  relatedHelp?: string[];
  color: string;
}

export interface HelpCard {
  id: string;
  title: string;
  category: string;
  body: string;
  tips?: string[];
  color: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  videoId: string;
  title: string;
  language: string;
  segments: TranscriptSegment[];
  fullText: string;
}

export interface ExtractedPattern {
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedDuration?: string;
  abbreviations: Abbreviation[];
  motifTags: string[];
  materials: { name: string; quantity: string }[];
  steps: {
    roundLabel: string;
    instruction: string;
    stitchCount?: number;
    timestampSec?: number;
    colorChange?: string;
    uncertain?: boolean;
    pdfPage?: number;
    imageHint?: string;
    imageDataUrl?: string;
  }[];
  gaps: Gap[];
}
