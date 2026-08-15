import { errorMessage, readOpenAiKey } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const key = readOpenAiKey(request);
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: { message?: string } };
      return NextResponse.json(
        { ok: false, error: data.error?.message || `OpenAI ${response.status}` },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 400 });
  }
}
