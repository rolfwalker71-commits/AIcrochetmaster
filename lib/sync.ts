"use client";

import { applyLibrary, db, getSettings, localLibrary } from "@/lib/db";
import { emptyLibrary, isLibrarySnapshot, mergeLibraries, type LibrarySnapshot } from "@/lib/library";

const SYNCED_KEY = "acm-library-synced";

let started = false;
let applying = false;
let dirty = false;
let timer: number | null = null;
let hooksInstalled = false;

export function startLibrarySync(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  installWriteHooks();
  void hydrate();
  window.addEventListener("online", () => {
    void (dirty ? pushLibrary() : hydrate());
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    void (dirty ? pushLibrary() : hydrate());
  });
}

export function scheduleLibraryPush(): void {
  if (applying) return;
  dirty = true;
  if (timer != null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    void pushLibrary();
  }, 800);
}

async function hydrate(): Promise<void> {
  try {
    const remote = await fetchLibrary();
    if (!remote) return;
    const local = await localLibrary();
    const seeded = window.localStorage.getItem(SYNCED_KEY) === "1";
    const openaiKey = (await getSettings()).openaiKey;

    if (!remote.patterns.length && !local.patterns.length) {
      window.localStorage.setItem(SYNCED_KEY, "1");
      return;
    }

    if (!remote.patterns.length && local.patterns.length) {
      window.localStorage.setItem(SYNCED_KEY, "1");
      await pushLibrary(true);
      return;
    }

    if (!seeded && local.patterns.length) {
      const merged = mergeLibraries(local, remote);
      await replaceLocal(merged, openaiKey);
      window.localStorage.setItem(SYNCED_KEY, "1");
      await pushLibrary(true);
      return;
    }

    await replaceLocal(remote, openaiKey);
    window.localStorage.setItem(SYNCED_KEY, "1");
  } catch {
    // offline or not signed in — keep the local copy
  }
}

async function replaceLocal(snapshot: LibrarySnapshot, openaiKey: string): Promise<void> {
  applying = true;
  try {
    await applyLibrary(snapshot, openaiKey);
  } finally {
    applying = false;
  }
}

async function pushLibrary(force = false): Promise<void> {
  if (applying && !force) return;
  const snapshot = await localLibrary();
  try {
    const response = await fetch("/api/library", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    if (response.ok) dirty = false;
  } catch {
    dirty = true;
  }
}

async function fetchLibrary(): Promise<LibrarySnapshot | null> {
  const response = await fetch("/api/library", {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Bibliothek konnte nicht geladen werden.");
  const data: unknown = await response.json();
  return isLibrarySnapshot(data) ? data : emptyLibrary();
}

function installWriteHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  const tables = [db.patterns, db.steps, db.materials, db.progress, db.settings];
  for (const table of tables) {
    table.hook("creating", () => scheduleLibraryPush());
    table.hook("updating", () => scheduleLibraryPush());
    table.hook("deleting", () => scheduleLibraryPush());
  }
}
