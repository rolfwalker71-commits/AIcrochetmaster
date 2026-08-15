import { errorMessage, openAiJson, readImageModel, readOpenAiKey } from "@/lib/openai";
import { headerImagePrompt } from "@/lib/prompts";
import { NextResponse } from "next/server";

interface ImageResponse {
  data?: { b64_json?: string; url?: string }[];
}

export async function POST(request: Request) {
  try {
    const key = readOpenAiKey(request);
    const model = readImageModel(request);
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      tags?: string[];
    };

    const prompt = headerImagePrompt(
      body.title || "Häkelstück",
      body.description || "",
      body.tags || [],
    );

    const payload: Record<string, unknown> = {
      model,
      prompt,
      size: "1024x1024",
      n: 1,
    };

    if (model === "dall-e-3") {
      payload.response_format = "b64_json";
      payload.quality = "standard";
    }

    const data = await openAiJson<ImageResponse>(key, "images/generations", payload);
    const first = data.data?.[0];
    if (first?.b64_json) {
      return NextResponse.json({ image: `data:image/png;base64,${first.b64_json}` });
    }
    if (first?.url) {
      const imageRes = await fetch(first.url);
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      return NextResponse.json({
        image: `data:image/png;base64,${buffer.toString("base64")}`,
      });
    }
    return NextResponse.json({ error: "Kein Bild erhalten." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
