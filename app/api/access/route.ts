import { accessSecret } from "@/lib/access";
import { hasServerOpenAiKey } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(accessSecret());
  return NextResponse.json({
    configured,
    openaiConfigured: hasServerOpenAiKey(),
    production: process.env.NODE_ENV === "production",
  });
}
