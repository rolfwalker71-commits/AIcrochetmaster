"use client";

import { CompanionStrip } from "@/components/companion-cards";
import { StepHelpGraphic } from "@/components/step-help-graphic";
import { StepPhoto } from "@/components/step-photo";
import { UsageNote } from "@/components/usage-note";
import { VideoPopout } from "@/components/video-popout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { companionCardsForPattern, companionCardsForStep } from "@/lib/companion-cards";
import { apiPost } from "@/lib/api";
import { db, deletePattern, getSettings, statusFromSteps } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Progress as ProgressState, Step } from "@/lib/types";
import { assignStepTimestamps, formatTimestamp, parseTimestamp } from "@/lib/youtube";
import { useLiveQuery } from "dexie-react-hooks";
import { CirclePlay, Info, ListOrdered, Minus, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Section = "projekt" | "infos" | "schritte";

const SECTIONS: {
  id: Section;
  title: string;
  hint: string;
  tone: "primary" | "secondary" | "accent";
  icon: typeof CirclePlay;
}[] = [
  { id: "projekt", title: "Projekt", hint: "Überblick und Quelle", tone: "primary", icon: CirclePlay },
  { id: "infos", title: "Material & Infos", hint: "Garn, Lücken, Karten", tone: "secondary", icon: Info },
  { id: "schritte", title: "Schritte", hint: "Runden häkeln", tone: "accent", icon: ListOrdered },
];

const TONE_BG = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
} as const;

export function PatternStudio({
  id,
  initialSection = "projekt",
}: {
  id: string;
  initialSection?: Section;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(initialSection);
  const [videoStart, setVideoStart] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const jumpedToOpenStep = useRef(false);
  const repairedTimes = useRef(false);
  const pattern = useLiveQuery(() => db.patterns.get(id), [id]);
  const steps = useLiveQuery(() => db.steps.where("patternId").equals(id).sortBy("order"), [id]);
  const materials = useLiveQuery(() => db.materials.where("patternId").equals(id).toArray(), [id]);
  const progress = useLiveQuery(() => db.progress.get(id), [id]);

  useEffect(() => {
    if (progress) return;
    getSettings().then((settings) => {
      void db.progress.put({
        patternId: id,
        currentStepIndex: 0,
        rowCounter: 0,
        rowCounterVisible: settings.showRowCounter,
      });
    });
  }, [id, progress]);

  useEffect(() => {
    if (section !== "schritte") return;
    let wake: WakeLockSentinel | undefined;
    navigator.wakeLock?.request("screen").then((lock) => {
      wake = lock;
    }).catch(() => undefined);
    return () => {
      void wake?.release();
    };
  }, [section]);

  const currentIndex = progress?.currentStepIndex ?? 0;
  const currentStep = steps?.[currentIndex];
  const hasVideo = Boolean(pattern?.videoId) && pattern?.source !== "pdf";
  const percent = useMemo(() => {
    if (!steps?.length) return 0;
    return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  }, [steps]);

  const ensureProgress = async (): Promise<ProgressState> => {
    if (progress) return progress;
    const settings = await getSettings();
    const next: ProgressState = {
      patternId: id,
      currentStepIndex: 0,
      rowCounter: 0,
      rowCounterVisible: settings.showRowCounter,
    };
    await db.progress.put(next);
    return next;
  };

  useEffect(() => {
    if (section !== "schritte") {
      jumpedToOpenStep.current = false;
      return;
    }
    if (!steps?.length || jumpedToOpenStep.current) return;
    jumpedToOpenStep.current = true;
    const nextOpen = steps.findIndex((step) => !step.done);
    const target = nextOpen === -1 ? steps.length - 1 : nextOpen;
    void (async () => {
      const current = await ensureProgress();
      if (current.currentStepIndex !== target) {
        await db.progress.put({ ...current, currentStepIndex: target });
      }
      window.setTimeout(() => {
      document.getElementById(`step-${target}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
      });
      }, 50);
    })();
  }, [section, steps, progress, id]);

  useEffect(() => {
    if (repairedTimes.current || !pattern || !steps?.length) return;
    if (!pattern.videoId || pattern.source === "pdf") return;
    const noneHaveTime = steps.every((step) => {
      const time = parseTimestamp(step.timestampSec);
      return time == null || time === 0;
    });
    if (!noneHaveTime) return;
    repairedTimes.current = true;
    void (async () => {
      try {
        const transcript = await apiPost<{ fullText: string }>("/api/transcript", {
          url: pattern.youtubeUrl || pattern.videoId,
        });
        const next = assignStepTimestamps(steps, transcript.fullText);
        if (next.some((step, index) => step.timestampSec !== steps[index].timestampSec)) {
          await db.steps.bulkPut(next);
        }
      } catch {
        repairedTimes.current = false;
      }
    })();
  }, [pattern, steps]);

  const go = async (index: number) => {
    if (!steps?.length) return;
    const current = await ensureProgress();
    const clamped = Math.max(0, Math.min(steps.length - 1, index));
    await db.progress.put({ ...current, currentStepIndex: clamped });
  };

  const toggleDone = async () => {
    if (!steps || !currentStep) return;
    const next = steps.map((item) =>
      item.id === currentStep.id ? { ...item, done: !item.done } : item,
    );
    await db.steps.bulkPut(next);
    await db.patterns.update(id, { status: statusFromSteps(next), updatedAt: Date.now() });
    if (!currentStep.done && currentIndex < steps.length - 1) {
      await go(currentIndex + 1);
    }
  };

  const toggleMaterial = async (materialId: string) => {
    if (!materials) return;
    await db.materials.bulkPut(
      materials.map((item) => (item.id === materialId ? { ...item, done: !item.done } : item)),
    );
  };

  if (pattern === undefined) return <p className="text-muted-foreground">Wird geladen …</p>;
  if (!pattern) return <p>Anleitung nicht gefunden.</p>;

  return (
    <div className={`space-y-4 ${hasVideo && videoStart != null ? "pb-64" : ""}`}>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Projektbereiche">
        {SECTIONS.map((item) => {
          const active = section === item.id;
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              type="button"
              role="tab"
              variant="ghost"
              aria-selected={active}
              onClick={() => setSection(item.id)}
              className={cn(
                "h-auto min-h-24 flex-col overflow-hidden rounded-3xl p-0 text-left",
                active && "ring-4 ring-accent/80",
              )}
            >
              <div className={cn("flex h-16 w-full items-center justify-center", TONE_BG[item.tone])}>
                <Icon className="size-8" aria-hidden />
              </div>
              <div className="w-full bg-card px-2 py-2 text-card-foreground">
                <p className="font-heading text-sm leading-tight">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.hint}</p>
              </div>
            </Button>
          );
        })}
      </div>

      {section === "projekt" && (
        <section className="space-y-4">
          <Card className="overflow-hidden rounded-3xl py-0">
            {pattern.headerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pattern.headerImage}
                alt={`Vorschaubild: ${pattern.title}`}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 items-center justify-center bg-muted font-heading text-3xl text-muted-foreground">
                Häkel
              </div>
            )}
            <CardHeader className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-primary">{pattern.difficulty}</p>
              <CardTitle className="font-heading text-3xl leading-tight">{pattern.title}</CardTitle>
              <CardDescription>{pattern.description}</CardDescription>
              {pattern.estimatedDuration && (
                <p className="text-sm text-muted-foreground">Dauer: {pattern.estimatedDuration}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {pattern.motifTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
          </Card>
          {pattern.source === "pdf" || !pattern.videoId ? (
            <Card className="rounded-3xl">
              <CardHeader>
                <p className="text-xs uppercase tracking-wide text-primary">Quelle</p>
                <CardTitle className="font-heading text-xl">PDF-Anleitung</CardTitle>
                <CardDescription>{pattern.sourceName || "Hochgeladene Datei"}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full gap-2"
              onClick={() => setVideoStart(parseTimestamp(currentStep?.timestampSec) ?? 0)}
            >
              <Play className="size-4" />
              Video öffnen
            </Button>
          )}
          {pattern.analysisUsage && <UsageNote usage={pattern.analysisUsage} />}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full">
                Anleitung löschen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anleitung löschen?</DialogTitle>
                <DialogDescription>Anleitung wirklich löschen?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    await deletePattern(pattern.id);
                    router.push("/");
                  }}
                >
                  Löschen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      )}

      {section === "infos" && (
        <section className="space-y-4">
          {pattern.gaps.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Offene Stellen</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc pl-4">
                  {pattern.gaps.map((gap, index) => (
                    <li key={`${gap.reason}-${index}`}>
                      {gap.reason}
                      {gap.suggestion ? ` — ${gap.suggestion}` : ""}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Material</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(materials ?? []).map((material) => (
                  <li key={material.id} className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={material.done}
                      onCheckedChange={() => void toggleMaterial(material.id)}
                      aria-label={material.name}
                    />
                    <span className={material.done ? "text-muted-foreground line-through" : ""}>
                      <strong>{material.name}</strong>
                      {material.quantity ? ` · ${material.quantity}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {pattern.abbreviations.length > 0 && (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading text-xl">Abkürzungen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {pattern.abbreviations.map((item) => (
                    <li key={item.short}>
                      <strong>{item.short}</strong> {item.meaning}
                      {item.us || item.uk ? ` (US ${item.us ?? "–"} / UK ${item.uk ?? "–"})` : ""}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <CompanionStrip
            title="Begleitkarten"
            cards={companionCardsForPattern(pattern.motifTags, steps ?? [])}
          />
        </section>
      )}

      {section === "schritte" && (
        <section className="space-y-3">
          <Progress value={percent} aria-label="Schritte erledigt" />
          <p className="text-xs text-muted-foreground">
            Schritt {currentIndex + 1} von {steps?.length ?? 0} · {percent}%
          </p>
          <h3 className="font-heading text-xl">Schritte</h3>
          <p className="text-sm text-muted-foreground">
            Tippe einen Schritt an. Vor, Zurück und Erledigt sitzen darunter.
            {hasVideo ? " Das Kamerasymbol springt zur Stelle im Video." : ""}
          </p>
          {(steps ?? []).map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              current={index === currentIndex}
              canPlayVideo={hasVideo}
              onSelect={() => void go(index)}
              onPlayVideo={() => {
                void go(index);
                setVideoStart(parseTimestamp(step.timestampSec) ?? 0);
              }}
              onBack={() => void go(index - 1)}
              onNext={() => void go(index + 1)}
              onToggleDone={() => void toggleDone()}
            />
          ))}
          {progress && (
            <Card className="rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-heading text-xl">Reihenzähler</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    void db.progress.put({
                      ...progress,
                      rowCounterVisible: !progress.rowCounterVisible,
                    })
                  }
                >
                  {progress.rowCounterVisible ? "Ausblenden" : "Einblenden"}
                </Button>
              </CardHeader>
              <CardContent>
                {progress.rowCounterVisible ? (
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      size="icon-lg"
                      variant="outline"
                      aria-label="Reihe minus"
                      onClick={() =>
                        void db.progress.put({
                          ...progress,
                          rowCounter: Math.max(0, progress.rowCounter - 1),
                        })
                      }
                    >
                      <Minus className="size-5" />
                    </Button>
                    <p className="font-heading text-5xl">{progress.rowCounter}</p>
                    <Button
                      type="button"
                      size="icon-lg"
                      aria-label="Reihe plus"
                      onClick={() =>
                        void db.progress.put({ ...progress, rowCounter: progress.rowCounter + 1 })
                      }
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ausgeblendet — Stand {progress.rowCounter} bleibt gespeichert.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      )}
      {hasVideo && videoStart != null && pattern.videoId && (
        <VideoPopout
          key={`${pattern.videoId}-${videoStart}`}
          videoId={pattern.videoId}
          startSec={videoStart}
          onClose={() => setVideoStart(null)}
        />
      )}
    </div>
  );
}

function StepCard({
  step,
  index,
  current,
  canPlayVideo,
  onSelect,
  onPlayVideo,
  onBack,
  onNext,
  onToggleDone,
}: {
  step: Step;
  index: number;
  current: boolean;
  canPlayVideo: boolean;
  onSelect: () => void;
  onPlayVideo: () => void;
  onBack: () => void;
  onNext: () => void;
  onToggleDone: () => void;
}) {
  const companions = companionCardsForStep(step);
  return (
    <article
      id={`step-${index}`}
      className={cn(
        "rounded-3xl p-4 transition",
        current
          ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-accent/70"
          : step.done
            ? "bg-card text-muted-foreground"
            : step.uncertain
              ? "border border-destructive/40 bg-destructive/10"
              : "bg-card",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        className="h-auto w-full flex-col items-stretch justify-start p-0 text-left whitespace-normal text-inherit hover:bg-transparent hover:text-inherit"
      >
        <p className={cn("text-xs uppercase tracking-wide", current ? "text-primary-foreground/80" : "text-primary")}>
          {current ? "Jetzt dran · " : ""}
          {step.roundLabel}
          {step.done ? " · erledigt" : ""}
          {step.uncertain ? " · unsicher" : ""}
        </p>
        <p className="mt-1 font-heading text-xl leading-snug">{step.instruction}</p>
        <p className={cn("mt-2 text-xs", current ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {[
            step.stitchCount != null ? `${step.stitchCount} Maschen` : "",
            parseTimestamp(step.timestampSec) != null
              ? formatTimestamp(parseTimestamp(step.timestampSec))
              : "",
            step.colorChange ?? "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </Button>
      {step.imageDataUrl && (
        <StepPhoto src={step.imageDataUrl} hint={step.imageHint} current={current} />
      )}
      <StepHelpGraphic step={step} companions={companions} current={current} />
      {canPlayVideo && (
        <Button
          type="button"
          variant={current ? "secondary" : "default"}
          className={cn("mt-3 gap-2", current && "bg-card text-card-foreground hover:bg-card/90")}
          aria-label={
            parseTimestamp(step.timestampSec) != null
              ? `Video bei ${formatTimestamp(parseTimestamp(step.timestampSec))} öffnen`
              : "Video öffnen"
          }
          onClick={onPlayVideo}
        >
          <Play className="size-4" />
          {parseTimestamp(step.timestampSec) != null
            ? formatTimestamp(parseTimestamp(step.timestampSec))
            : "Video"}
        </Button>
      )}
      {current && (
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1 bg-card text-card-foreground hover:bg-card/90" onClick={onBack}>
            Zurück
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onToggleDone}>
            {step.done ? "Offen" : "Erledigt"}
          </Button>
          <Button type="button" variant="secondary" className="flex-1 bg-card text-card-foreground hover:bg-card/90" onClick={onNext}>
            Weiter
          </Button>
        </div>
      )}
    </article>
  );
}
