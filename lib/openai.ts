import type { ImageModel, TextModel } from "./types";

export function readOpenAiKey(request: Request): string {
  const key = request.headers.get("x-openai-key")?.trim();
  if (!key) {
    throw new Error("Kein OpenAI-Key im Request. Bitte in den Einstellungen hinterlegen.");
  }
  return key;
}

export function readTextModel(request: Request): TextModel {
  const model = request.headers.get("x-text-model")?.trim();
  if (model === "gpt-4o" || model === "gpt-4.1" || model === "gpt-4o-mini") {
    return model;
  }
  return "gpt-4o";
}

export function readImageModel(request: Request): ImageModel {
  const model = request.headers.get("x-image-model")?.trim();
  if (model === "gpt-image-1" || model === "dall-e-3") {
    return model;
  }
  return "gpt-image-1";
}

export async function openAiJson<T>(
  key: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI-Fehler (${response.status})`);
  }
  return data;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unbekannter Fehler";
}
