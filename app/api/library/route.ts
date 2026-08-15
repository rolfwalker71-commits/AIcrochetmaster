import { requireApiAccess } from "@/lib/guard";
import { emptyLibrary, isLibrarySnapshot } from "@/lib/library";
import { errorMessage } from "@/lib/openai";
import { readLibrary, writeLibrary } from "@/lib/server-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireApiAccess();
  if (denied) return denied;
  try {
    const library = await readLibrary();
    return NextResponse.json(library, {
      headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireApiAccess();
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!isLibrarySnapshot(body)) {
      return NextResponse.json({ error: "Ungültige Bibliothek." }, { status: 400 });
    }
    const snapshot = {
      ...emptyLibrary(),
      ...body,
      version: 1 as const,
      updatedAt: Date.now(),
    };
    await writeLibrary(snapshot);
    return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
