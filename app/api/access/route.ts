import { accessSecret } from "@/lib/access";
import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(accessSecret());
  return NextResponse.json({
    configured,
    production: process.env.NODE_ENV === "production",
  });
}
