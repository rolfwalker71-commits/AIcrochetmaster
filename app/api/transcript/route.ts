import { errorMessage } from "@/lib/openai";
import { fetchYoutubeTranscript } from "@/lib/transcript";
import { extractYoutubeVideoId, youtubeWatchUrl } from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const videoId = extractYoutubeVideoId(body.url || "");
    if (!videoId) {
      return NextResponse.json(
        { error: "Das sieht nicht nach einem YouTube-Link aus." },
        { status: 400 },
      );
    }

    const transcript = await fetchYoutubeTranscript(videoId);
    return NextResponse.json({
      ...transcript,
      youtubeUrl: youtubeWatchUrl(videoId),
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
