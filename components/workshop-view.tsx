"use client";

import { db, statusFromSteps } from "@/lib/db";
import type { Material, Pattern, Progress, Step } from "@/lib/types";
import { formatTimestamp, youtubeEmbedUrl } from "@/lib/youtube";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function WorkshopView({
  pattern,
  initialSteps,
  initialMaterials,
  initialProgress,
}: {
  pattern: Pattern;
  initialSteps: Step[];
  initialMaterials: Material[];
  initialProgress: Progress;
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [materials, setMaterials] = useState(initialMaterials);
  const [progress, setProgress] = useState(initialProgress);
  const [embedStart, setEmbedStart] = useState<number | undefined>(
    initialSteps[initialProgress.currentStepIndex]?.timestampSec,
  );

  const step = steps[progress.currentStepIndex] ?? steps[0];
  const percent = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round((steps.filter((item) => item.done).length / steps.length) * 100);
  }, [steps]);

  useEffect(() => {
    let wake: WakeLockSentinel | undefined;
    const request = async () => {
      try {
        wake = await navigator.wakeLock?.request("screen");
      } catch {
        // unsupported
      }
    };
    void request();
    return () => {
      void wake?.release();
    };
  }, []);

  const persistProgress = async (next: Progress) => {
    setProgress(next);
    await db.progress.put(next);
  };

  const persistSteps = async (next: Step[]) => {
    setSteps(next);
    await db.steps.bulkPut(next);
    await db.patterns.update(pattern.id, {
      status: statusFromSteps(next),
      updatedAt: Date.now(),
    });
  };

  const go = async (index: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, index));
    const target = steps[clamped];
    setEmbedStart(target?.timestampSec);
    await persistProgress({ ...progress, currentStepIndex: clamped });
  };

  const toggleDone = async () => {
    if (!step) return;
    const next = steps.map((item) =>
      item.id === step.id ? { ...item, done: !item.done } : item,
    );
    await persistSteps(next);
    if (!step.done && progress.currentStepIndex < steps.length - 1) {
      await go(progress.currentStepIndex + 1);
    }
  };

  const toggleMaterial = async (id: string) => {
    const next = materials.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    );
    setMaterials(next);
    await db.materials.bulkPut(next);
  };

  if (!step) {
    return <p>Keine Schritte vorhanden.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-ink">
        <iframe
          title="YouTube"
          className="aspect-video w-full"
          src={youtubeEmbedUrl(pattern.videoId, embedStart)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-sage transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted">
        Schritt {progress.currentStepIndex + 1} von {steps.length} · {percent}%
      </p>

      <section className="rounded-3xl bg-foam p-5 card-shadow">
        <p className="text-xs uppercase tracking-[0.18em] text-terracotta">{step.roundLabel}</p>
        <p className="mt-2 font-display text-2xl leading-snug">{step.instruction}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
          {step.stitchCount != null && <span>Soll: {step.stitchCount} Maschen</span>}
          {step.colorChange && <span>Farbe: {step.colorChange}</span>}
          {step.timestampSec != null && (
            <button
              type="button"
              className="underline"
              onClick={() => setEmbedStart(step.timestampSec)}
            >
              Video {formatTimestamp(step.timestampSec)}
            </button>
          )}
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-full border border-line py-3"
          onClick={() => void go(progress.currentStepIndex - 1)}
        >
          Zurück
        </button>
        <button
          type="button"
          className="flex-1 rounded-full bg-sage py-3 font-semibold text-white"
          onClick={() => void toggleDone()}
        >
          {step.done ? "Offen" : "Erledigt"}
        </button>
        <button
          type="button"
          className="flex-1 rounded-full border border-line py-3"
          onClick={() => void go(progress.currentStepIndex + 1)}
        >
          Weiter
        </button>
      </div>

      <section className="rounded-3xl bg-foam p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Reihenzähler</h2>
          <button
            type="button"
            className="text-sm text-terracotta"
            onClick={() =>
              void persistProgress({
                ...progress,
                rowCounterVisible: !progress.rowCounterVisible,
              })
            }
          >
            {progress.rowCounterVisible ? "Ausblenden" : "Einblenden"}
          </button>
        </div>
        {progress.rowCounterVisible && (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="h-14 w-14 rounded-full bg-cream text-2xl"
              onClick={() =>
                void persistProgress({
                  ...progress,
                  rowCounter: Math.max(0, progress.rowCounter - 1),
                })
              }
            >
              −
            </button>
            <p className="font-display text-5xl">{progress.rowCounter}</p>
            <button
              type="button"
              className="h-14 w-14 rounded-full bg-terracotta text-2xl text-white"
              onClick={() =>
                void persistProgress({ ...progress, rowCounter: progress.rowCounter + 1 })
              }
            >
              +
            </button>
          </div>
        )}
        {!progress.rowCounterVisible && (
          <p className="mt-2 text-sm text-muted">
            Ausgeblendet — Stand {progress.rowCounter} bleibt gespeichert.
          </p>
        )}
      </section>

      <section className="rounded-3xl bg-foam p-4">
        <h2 className="font-display text-xl">Material</h2>
        <ul className="mt-3 space-y-2">
          {materials.map((material) => (
            <li key={material.id}>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={material.done}
                  onChange={() => void toggleMaterial(material.id)}
                />
                <span className={material.done ? "text-muted line-through" : ""}>
                  <strong>{material.name}</strong>
                  {material.quantity ? ` · ${material.quantity}` : ""}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <Link href={`/pattern/${pattern.id}`} className="block text-center text-sm text-muted">
        Zur Anleitung
      </Link>
    </div>
  );
}
