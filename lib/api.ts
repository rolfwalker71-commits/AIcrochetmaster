import type { Settings } from "./types";

export async function apiPost<T>(
  path: string,
  body: unknown,
  settings?: Pick<Settings, "openaiKey" | "textModel" | "imageModel">,
  timeoutMs = 180_000,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings) {
    if (settings.openaiKey) {
      headers["x-openai-key"] = settings.openaiKey;
    }
    headers["x-text-model"] = settings.textModel;
    headers["x-image-model"] = settings.imageModel;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Das hat zu lange gedauert. Bitte noch einmal versuchen.");
    }
    throw error;
  }
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Die Anfrage ist fehlgeschlagen.");
  }
  return data;
}

export async function apiPostForm<T>(
  path: string,
  form: FormData,
  settings: Pick<Settings, "openaiKey" | "textModel" | "imageModel">,
  timeoutMs = 180_000,
): Promise<T> {
  const headers: Record<string, string> = {
    "x-text-model": settings.textModel,
    "x-image-model": settings.imageModel,
  };
  if (settings.openaiKey) {
    headers["x-openai-key"] = settings.openaiKey;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers,
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Das hat zu lange gedauert. Bitte noch einmal versuchen.");
    }
    throw error;
  }
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Die Anfrage ist fehlgeschlagen.");
  }
  return data;
}
