import type { Settings } from "./types";

export async function apiPost<T>(
  path: string,
  body: unknown,
  settings?: Pick<Settings, "openaiKey" | "textModel" | "imageModel">,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings?.openaiKey) {
    headers["x-openai-key"] = settings.openaiKey;
    headers["x-text-model"] = settings.textModel;
    headers["x-image-model"] = settings.imageModel;
  }

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Die Anfrage ist fehlgeschlagen.");
  }
  return data;
}
