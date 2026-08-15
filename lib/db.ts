"use client";

import Dexie, { type Table } from "dexie";
import {
  DEFAULT_SETTINGS,
  type Material,
  type Pattern,
  type Progress,
  type Settings,
  type Step,
} from "./types";

class CrochetDB extends Dexie {
  patterns!: Table<Pattern, string>;
  steps!: Table<Step, string>;
  materials!: Table<Material, string>;
  progress!: Table<Progress, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("aicrochetmaster");
    this.version(1).stores({
      patterns: "id, status, createdAt, videoId",
      steps: "id, patternId, order",
      materials: "id, patternId",
      progress: "patternId",
      settings: "id",
    });
  }
}

export const db = new CrochetDB();

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get("settings");
  if (stored) return { ...DEFAULT_SETTINGS, ...stored };
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...partial, id: "settings" as const };
  await db.settings.put(next);
  return next;
}

export async function deletePattern(patternId: string): Promise<void> {
  await db.transaction("rw", db.patterns, db.steps, db.materials, db.progress, async () => {
    await db.steps.where("patternId").equals(patternId).delete();
    await db.materials.where("patternId").equals(patternId).delete();
    await db.progress.delete(patternId);
    await db.patterns.delete(patternId);
  });
}

export function patternProgressPercent(steps: Step[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => step.done).length;
  return Math.round((done / steps.length) * 100);
}

export function statusFromSteps(steps: Step[]): Pattern["status"] {
  if (steps.length === 0) return "inbox";
  const done = steps.filter((step) => step.done).length;
  if (done === 0) return "inbox";
  if (done === steps.length) return "done";
  return "in_progress";
}
