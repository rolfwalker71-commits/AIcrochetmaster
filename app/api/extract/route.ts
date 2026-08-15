import { extractPatternFromTranscript } from "@/lib/extract";
import { errorMessage, readOpenAiKey, readTextModel } from "@/lib/openai";
import type { TranscriptResult } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const key = readOpenAiKey(request);
    const model = readTextModel(request);
    const transcript = (await request.json()) as TranscriptResult;
    if (!transcript?.fullText || !transcript.videoId) {
      return NextResponse.json({ error: "Transkript fehlt." }, { status: 400 });
    }
    const extraction = await extractPatternFromTranscript(key, model, transcript);
    return NextResponse.json(extraction);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
