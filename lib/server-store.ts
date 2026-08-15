import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptyLibrary, isLibrarySnapshot, type LibrarySnapshot } from "./library";

function dataDir(): string {
  const env = process.env;
  return (env["DATA_DIR"] || path.join(process.cwd(), "data")).trim() || path.join(process.cwd(), "data");
}

function libraryPath(): string {
  return path.join(dataDir(), "library.json");
}

export async function readLibrary(): Promise<LibrarySnapshot> {
  try {
    const raw = await readFile(libraryPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isLibrarySnapshot(parsed)) return parsed;
  } catch {
    // missing or unreadable file → empty library
  }
  return emptyLibrary();
}

let writes: Promise<void> = Promise.resolve();

export function writeLibrary(snapshot: LibrarySnapshot): Promise<void> {
  writes = writes.then(() => persist(snapshot), () => persist(snapshot));
  return writes;
}

async function persist(snapshot: LibrarySnapshot): Promise<void> {
  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  const target = libraryPath();
  const temp = `${target}.${process.pid}.tmp`;
  const payload: LibrarySnapshot = { ...snapshot, version: 1, updatedAt: Date.now() };
  await writeFile(temp, JSON.stringify(payload));
  await rename(temp, target);
}
