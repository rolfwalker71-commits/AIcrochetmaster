"use client";

import { UsageNote } from "@/components/usage-note";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, apiPostForm } from "@/lib/api";
import { db, getSettings } from "@/lib/db";
import { createId } from "@/lib/id";
import type { ExtractedPattern, PatternSource, TranscriptResult } from "@/lib/types";
import { compactHeaderImage } from "@/lib/image-compact";
import { attachPdfPageImages } from "@/lib/pdf-pages";
import {
  estimateFromPdf,
  estimateFromTranscript,
  type AnalysisUsage,
} from "@/lib/usage";
import { extractYoutubeVideoId, youtubeWatchUrl } from "@/lib/youtube";
import { FileText, LoaderCircle, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Phase = "idle" | "transcript" | "extract" | "pages" | "image" | "saving";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  transcript: "Transkript wird geholt …",
  extract: "Anleitung wird extrahiert …",
  pages: "PDF-Bilder werden zugeordnet …",
  image: "Headerbild wird erzeugt …",
  saving: "Wird in der Bibliothek gespeichert …",
};

export function ImportWizard({
  initialText = "",
  initialKind = "video",
}: {
  initialText?: string;
  initialKind?: "video" | "pdf";
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialText);
  const [pdfName, setPdfName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [usage, setUsage] = useState<AnalysisUsage | null>(null);

  useEffect(() => {
    Promise.all([
      getSettings(),
      fetch("/api/access")
        .then((response) => response.json())
        .catch(() => ({ openaiConfigured: false })),
    ]).then(([settings, access]: [Awaited<ReturnType<typeof getSettings>>, { openaiConfigured?: boolean }]) => {
      setHasKey(Boolean(settings.openaiKey) || Boolean(access.openaiConfigured));
    });
  }, []);

  useEffect(() => {
    const id = initialKind === "pdf" ? "import-pdf" : "import-video";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialKind]);

  const busy = phase !== "idle";
  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 500);
    return () => window.clearInterval(timer);
  }, [busy, phase]);

  const parsedId = useMemo(() => extractYoutubeVideoId(url), [url]);

  const run = async () => {
    setError("");
    const settings = await getSettings();
    if (!parsedId) {
      setError("Bitte einen gültigen YouTube-Link einfügen.");
      return;
    }

    try {
      setUsage(null);
      setElapsedSec(0);
      setPhase("transcript");
      const nextTranscript = await apiPost<TranscriptResult & { youtubeUrl: string }>(
        "/api/transcript",
        { url },
      );
      setPhase("extract");
      setUsage(estimateFromTranscript(settings.textModel, nextTranscript.fullText.length));
      const result = await apiPost<{ extraction: ExtractedPattern; usage: AnalysisUsage }>(
        "/api/extract",
        {
          videoId: nextTranscript.videoId,
          title: nextTranscript.title,
          language: nextTranscript.language,
          fullText: nextTranscript.fullText,
          segments: [],
        },
        settings,
        300_000,
      );
      const extraction = result.extraction;
      let nextUsage = result.usage ?? estimateFromTranscript(settings.textModel, nextTranscript.fullText.length);

      setPhase("image");
      setUsage(nextUsage);
      let headerImage: string | undefined;
      try {
        const image = await apiPost<{ image: string; imageUsd?: number }>(
          "/api/image",
          {
            title: extraction.title,
            description: extraction.description,
            tags: extraction.motifTags,
          },
          settings,
        );
        headerImage = image.image ? await compactHeaderImage(image.image) : undefined;
        if (image.imageUsd != null) {
          nextUsage = { ...nextUsage, estimated: false, imageUsd: image.imageUsd };
          setUsage(nextUsage);
        }
      } catch {
        headerImage = undefined;
      }

      setPhase("saving");
      const id = await persistPattern({
        draft: extraction,
        headerImage,
        showRowCounter: settings.showRowCounter,
        source: "youtube",
        youtubeUrl: nextTranscript.youtubeUrl || youtubeWatchUrl(nextTranscript.videoId),
        videoId: nextTranscript.videoId,
        analysisUsage: { ...nextUsage, estimated: false },
      });
      router.push(`/pattern/${id}`);
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    }
  };

  const runPdf = async () => {
    setError("");
    const settings = await getSettings();
    if (!pdfFile) {
      setError("Bitte eine Amigurumi-PDF wählen.");
      return;
    }

    try {
      setUsage(estimateFromPdf(settings.textModel, pdfFile.size));
      setElapsedSec(0);
      setPhase("extract");
      const form = new FormData();
      form.set("file", pdfFile);
      const result = await apiPostForm<{
        extraction: ExtractedPattern;
        sourceName: string;
        usage?: AnalysisUsage;
      }>(
        "/api/extract-pdf",
        form,
        settings,
        180_000,
      );
      let nextUsage = result.usage ?? estimateFromPdf(settings.textModel, pdfFile.size);
      setUsage(nextUsage);

      setPhase("pages");
      try {
        result.extraction.steps = await attachPdfPageImages(pdfFile, result.extraction.steps);
      } catch {
        // Anleitung bleibt, nur ohne Seitenbilder
      }

      setPhase("image");
      let headerImage: string | undefined;
      try {
        const image = await apiPost<{ image: string; imageUsd?: number }>(
          "/api/image",
          {
            title: result.extraction.title,
            description: result.extraction.description,
            tags: result.extraction.motifTags,
          },
          settings,
        );
        headerImage = image.image ? await compactHeaderImage(image.image) : undefined;
        if (image.imageUsd != null) {
          nextUsage = { ...nextUsage, estimated: false, imageUsd: image.imageUsd };
          setUsage(nextUsage);
        }
      } catch {
        headerImage = undefined;
      }

      setPhase("saving");
      const id = await persistPattern({
        draft: result.extraction,
        headerImage,
        showRowCounter: settings.showRowCounter,
        source: "pdf",
        sourceName: result.sourceName,
        analysisUsage: { ...nextUsage, estimated: false },
      });
      router.push(`/pattern/${id}`);
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "PDF-Import fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Import</h1>
      <Card id="import-video" className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">YouTube-Link</CardTitle>
          <CardDescription>
            Amigurumi-Video teilen oder den Link einfügen. Es geht nur um Figuren, nicht um Decken oder Kleidung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block">
            <span className="sr-only">YouTube-Link</span>
            <Textarea
              rows={3}
              inputMode="url"
              autoComplete="url"
              placeholder="https://youtu.be/…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {parsedId ? `Video-ID: ${parsedId}` : "Noch kein gültiger YouTube-Link erkannt."}
          </p>
          {hasKey === false && (
            <Alert>
              <AlertDescription>
                Ohne OpenAI-Key kein Import. Bitte OPENAI_API_KEY in der .env setzen
                oder optional unter Mehr einen anderen Key hinterlegen.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!usage && !busy && (
            <p className="text-xs text-muted-foreground">
              YouTube liefert nur den Text. Die Anleitung erzeugt danach OpenAI — Token und Preis
              gelten für diese Analyse, nicht fürs Transkript.
            </p>
          )}
          <Button type="button" size="lg" className="w-full gap-2" onClick={() => void run()} disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Video className="size-4" />}
            {phase === "idle" ? "Transkript analysieren" : PHASE_LABEL[phase]}
          </Button>
        </CardContent>
      </Card>

      <Card id="import-pdf" className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">PDF-Figur</CardTitle>
          <CardDescription>
            Schriftliche Amigurumi-Anleitung hochladen. Text, Fotos und Diagramme werden gelesen.
            Passende Seitenbilder hängen danach am jeweiligen Schritt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block">
            <span className="sr-only">PDF wählen</span>
            <Input
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              className="pt-2 file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-1 file:font-semibold file:text-primary-foreground"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPdfFile(file);
                setPdfName(file?.name ?? "");
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {pdfName ? `Datei: ${pdfName}` : "Noch keine PDF gewählt. Maximal 12 MB."}
          </p>
          <Button type="button" size="lg" className="w-full gap-2" onClick={() => void runPdf()} disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {phase === "idle" ? "PDF analysieren" : PHASE_LABEL[phase]}
          </Button>
        </CardContent>
      </Card>

      {usage && <UsageNote usage={usage} />}
      {busy && (
        <p className="text-center text-sm text-muted-foreground" role="status" aria-live="polite">
          {PHASE_LABEL[phase]} {elapsedSec > 0 ? `${elapsedSec}s` : ""}
          {phase === "extract" && (
            <>
              <br />
              Video oder PDF braucht oft 1–3 Minuten. Danach liegt die Anleitung in der Bibliothek.
            </>
          )}
        </p>
      )}
    </div>
  );
}

async function persistPattern(input: {
  draft: ExtractedPattern;
  headerImage: string | undefined;
  showRowCounter: boolean;
  source: PatternSource;
  youtubeUrl?: string;
  videoId?: string;
  sourceName?: string;
  analysisUsage?: AnalysisUsage;
}): Promise<string> {
  const { draft, headerImage, showRowCounter, source } = input;
  const id = createId();
  const now = Date.now();

  await db.patterns.put({
    id,
    title: draft.title,
    description: draft.description,
    youtubeUrl: input.youtubeUrl || "",
    videoId: input.videoId || "",
    source,
    sourceName: input.sourceName,
    headerImage,
    difficulty: draft.difficulty,
    estimatedDuration: draft.estimatedDuration,
    status: "inbox",
    abbreviations: draft.abbreviations,
    motifTags: draft.motifTags,
    gaps: draft.gaps,
    analysisUsage: input.analysisUsage,
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
      uncertain: step.uncertain,
      pdfPage: step.pdfPage,
      imageHint: step.imageHint,
      imageDataUrl: step.imageDataUrl,
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
    rowCounterVisible: showRowCounter,
  });

  return id;
}
