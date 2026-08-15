"use client";

import { ReviewEditor } from "@/components/review-editor";
import { apiPost } from "@/lib/api";
import { db, getSettings } from "@/lib/db";
import { createId } from "@/lib/id";
import type { ExtractedPattern, TranscriptResult } from "@/lib/types";
import { extractYoutubeVideoId, youtubeWatchUrl } from "@/lib/youtube";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Phase = "idle" | "transcript" | "extract" | "image" | "review" | "saving";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  transcript: "Transkript wird geholt …",
  extract: "Anleitung wird extrahiert …",
  image: "Headerbild wird erzeugt …",
  review: "Bitte prüfen und speichern",
  saving: "Wird gespeichert …",
};

export function ImportWizard({ initialText = "" }: { initialText?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialText);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<(TranscriptResult & { youtubeUrl: string }) | null>(
    null,
  );
  const [draft, setDraft] = useState<ExtractedPattern | null>(null);
  const [headerImage, setHeaderImage] = useState<string>();

  useEffect(() => {
    getSettings().then((settings) => setHasKey(Boolean(settings.openaiKey)));
  }, []);

  const parsedId = useMemo(() => extractYoutubeVideoId(url), [url]);

  const run = async () => {
    setError("");
    const settings = await getSettings();
    if (!settings.openaiKey) {
      setError("Bitte zuerst den OpenAI-Key in den Einstellungen hinterlegen.");
      return;
    }
    if (!parsedId) {
      setError("Bitte einen gültigen YouTube-Link einfügen.");
      return;
    }

    try {
      setPhase("transcript");
      const nextTranscript = await apiPost<TranscriptResult & { youtubeUrl: string }>(
        "/api/transcript",
        { url },
      );
      setTranscript(nextTranscript);

      setPhase("extract");
      const extraction = await apiPost<ExtractedPattern>("/api/extract", nextTranscript, settings);
      setDraft(extraction);

      setPhase("image");
      try {
        const image = await apiPost<{ image: string }>(
          "/api/image",
          {
            title: extraction.title,
            description: extraction.description,
            tags: extraction.motifTags,
          },
          settings,
        );
        setHeaderImage(image.image);
      } catch {
        setHeaderImage(undefined);
      }

      setPhase("review");
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
  };

  const save = async () => {
    if (!draft || !transcript) return;
    setPhase("saving");
    const settings = await getSettings();
    const id = createId();
    const now = Date.now();

    await db.patterns.put({
      id,
      title: draft.title,
      description: draft.description,
      youtubeUrl: transcript.youtubeUrl || youtubeWatchUrl(transcript.videoId),
      videoId: transcript.videoId,
      headerImage,
      difficulty: draft.difficulty,
      estimatedDuration: draft.estimatedDuration,
      status: "inbox",
      abbreviations: draft.abbreviations,
      motifTags: draft.motifTags,
      gaps: draft.gaps,
      createdAt: now,
      updatedAt: now,
    });

    await db.steps.bulkPut(
      draft.steps.map((step, index) => ({
        id: createId(),
        patternId: id,
        order: index,
        roundLabel: step.roundLabel,
        instruction: step.instruction,
        stitchCount: step.stitchCount,
        timestampSec: step.timestampSec,
        colorChange: step.colorChange,
        done: false,
        note: "",
      })),
    );

    await db.materials.bulkPut(
      draft.materials.map((material) => ({
        id: createId(),
        patternId: id,
        name: material.name,
        quantity: material.quantity,
        done: false,
      })),
    );

    await db.progress.put({
      patternId: id,
      currentStepIndex: 0,
      rowCounter: 0,
      rowCounterVisible: settings.showRowCounter,
    });

    router.push(`/pattern/${id}`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-foam p-4 card-shadow">
        <p className="font-display text-2xl">YouTube-Link</p>
        <p className="mt-1 text-sm text-muted">
          Link einfügen oder — nach Installation — ein Video aus YouTube teilen.
        </p>
        <textarea
          className="mt-3 w-full rounded-2xl border border-line bg-cream/40 px-3 py-3"
          rows={3}
          placeholder="https://youtu.be/…"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <p className="mt-2 text-xs text-muted">
          {parsedId ? `Video-ID: ${parsedId}` : "Noch kein gültiger YouTube-Link erkannt."}
        </p>
        {hasKey === false && (
          <p className="mt-3 rounded-2xl bg-rose/10 px-3 py-2 text-sm">
            Ohne OpenAI-Key kein Import. Bitte unter Mehr hinterlegen.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-terracotta-dark">{error}</p>}
        <button
          type="button"
          onClick={() => void run()}
          disabled={phase !== "idle" && phase !== "review"}
          className="mt-4 w-full rounded-full bg-terracotta py-3 font-semibold text-white disabled:opacity-60"
        >
          {phase === "idle" || phase === "review" ? "Transkript analysieren" : PHASE_LABEL[phase]}
        </button>
      </div>

      {phase !== "idle" && phase !== "review" && (
        <p className="text-center text-sm text-muted">{PHASE_LABEL[phase]}</p>
      )}

      {phase === "review" && draft && (
        <div className="space-y-4">
          {headerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={headerImage} alt="" className="h-44 w-full rounded-3xl object-cover" />
          )}
          <ReviewEditor value={draft} onChange={setDraft} />
          <button
            type="button"
            onClick={() => void save()}
            className="w-full rounded-full bg-sage py-3 font-semibold text-white"
          >
            In die Bibliothek legen
          </button>
        </div>
      )}
    </div>
  );
}
