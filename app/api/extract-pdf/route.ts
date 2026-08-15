import { extractPatternFromPdf } from "@/lib/extract";
import { requireApiAccess } from "@/lib/guard";
import { errorMessage, readOpenAiKey, readTextModel } from "@/lib/openai";
import { NextResponse } from "next/server";

export const maxDuration = 300;

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await requireApiAccess();
  if (denied) return denied;
  try {
    const key = readOpenAiKey(request);
    const model = readTextModel(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Bitte eine PDF-Datei wählen." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Nur PDF-Dateien sind möglich." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Die PDF ist größer als 12 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      return NextResponse.json({ error: "Die Datei ist keine gültige PDF." }, { status: 400 });
    }
    const { extraction, usage } = await extractPatternFromPdf(
      key,
      model,
      file.name || "anleitung.pdf",
      bytes,
    );
    return NextResponse.json({
      extraction,
      usage,
      sourceName: file.name || "anleitung.pdf",
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
