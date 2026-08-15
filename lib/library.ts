import type { Material, Pattern, Progress, Settings, Step } from "./types";

export type SharedSettings = Pick<
  Settings,
  "textModel" | "imageModel" | "showRowCounter" | "largeText"
>;

export interface LibrarySnapshot {
  version: 1;
  updatedAt: number;
  patterns: Pattern[];
  steps: Step[];
  materials: Material[];
  progress: Progress[];
  settings: SharedSettings;
}

export function emptyLibrary(): LibrarySnapshot {
  return {
    version: 1,
    updatedAt: 0,
    patterns: [],
    steps: [],
    materials: [],
    progress: [],
    settings: {
      textModel: "gpt-4o",
      imageModel: "gpt-image-1",
      showRowCounter: true,
      largeText: false,
    },
  };
}

export function isLibrarySnapshot(value: unknown): value is LibrarySnapshot {
  if (!value || typeof value !== "object") return false;
  const data = value as LibrarySnapshot;
  return (
    data.version === 1 &&
    typeof data.updatedAt === "number" &&
    Array.isArray(data.patterns) &&
    Array.isArray(data.steps) &&
    Array.isArray(data.materials) &&
    Array.isArray(data.progress) &&
    Boolean(data.settings) &&
    typeof data.settings === "object"
  );
}

export function mergeLibraries(local: LibrarySnapshot, remote: LibrarySnapshot): LibrarySnapshot {
  const localPatterns = new Map(local.patterns.map((pattern) => [pattern.id, pattern]));
  const remotePatterns = new Map(remote.patterns.map((pattern) => [pattern.id, pattern]));
  const ids = new Set([...localPatterns.keys(), ...remotePatterns.keys()]);

  const patterns: Pattern[] = [];
  const steps: Step[] = [];
  const materials: Material[] = [];
  const progress: Progress[] = [];

  for (const id of ids) {
    const fromLocal = localPatterns.get(id);
    const fromRemote = remotePatterns.get(id);
    const chosen =
      !fromLocal ? fromRemote! : !fromRemote ? fromLocal : newerPattern(fromLocal, fromRemote);
    const source = chosen === fromLocal ? local : remote;
    patterns.push(chosen);
    steps.push(...source.steps.filter((step) => step.patternId === id));
    materials.push(...source.materials.filter((material) => material.patternId === id));
    const row = source.progress.find((item) => item.patternId === id);
    if (row) progress.push(row);
  }

  return {
    version: 1,
    updatedAt: Date.now(),
    patterns,
    steps,
    materials,
    progress,
    settings: (remote.updatedAt || 0) >= (local.updatedAt || 0) ? remote.settings : local.settings,
  };
}

function newerPattern(left: Pattern, right: Pattern): Pattern {
  const leftTime = left.updatedAt || left.createdAt || 0;
  const rightTime = right.updatedAt || right.createdAt || 0;
  return leftTime >= rightTime ? left : right;
}
