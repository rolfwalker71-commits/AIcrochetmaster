"use client";

import { CompanionStrip } from "@/components/companion-cards";
import { companionCardsForPattern, companionCardsForStep } from "@/lib/companion-cards";
import { db, deletePattern, getSettings, statusFromSteps } from "@/lib/db";
import type { Progress, Step } from "@/lib/types";
import { formatTimestamp, youtubeEmbedUrl } from "@/lib/youtube";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Section = "projekt" | "infos" | "schritte";

const SECTIONS: {
  id: Section;
  title: string;
  hint: string;
  color: string;
  icon: "play" | "info" | "steps";
}[] = [
  { id: "projekt", title: "Projekt & Video", hint: "Überblick und YouTube", color: "#C45C26", icon: "play" },
  { id: "infos", title: "Material & Infos", hint: "Garn, Lücken, Karten", color: "#4C7A62", icon: "info" },
  { id: "schritte", title: "Schritte", hint: "Runden häkeln", color: "#D4A04A", icon: "steps" },
];

export function PatternStudio({
  id,
  initialSection = "projekt",
}: {
  id: string;
  initialSection?: Section;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(initialSection);
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
  const percent = useMemo(() => {
    if (!steps?.length) return 0;
    return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  }, [steps]);

  const ensureProgress = async (): Promise<Progress> => {
    if (progress) return progress;
    const settings = await getSettings();
    const next: Progress = {
      patternId: id,
      currentStepIndex: 0,
      rowCounter: 0,
      rowCounterVisible: settings.showRowCounter,
    };
    await db.progress.put(next);
    return next;
  };

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

  if (pattern === undefined) return <p className="text-muted">Wird geladen …</p>;
  if (!pattern) return <p>Anleitung nicht gefunden.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {SECTIONS.map((item) => {
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`card-shadow overflow-hidden rounded-3xl text-left ${
                active ? "ring-4 ring-yarn/80" : ""
              }`}
            >
              <div className="flex h-16 items-center justify-center" style={{ background: item.color }}>
                <SectionIcon icon={item.icon} />
              </div>
              <div className="bg-foam px-2 py-2">
                <p className="font-display text-[13px] leading-tight">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-muted">{item.hint}</p>
              </div>
            </button>
          );
        })}
      </div>

      {section === "projekt" && (
        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl bg-foam card-shadow">
            {pattern.headerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pattern.headerImage} alt="" className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-line text-5xl">🧶</div>
            )}
            <div className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wide text-terracotta">{pattern.difficulty}</p>
              <h2 className="font-display text-3xl leading-tight">{pattern.title}</h2>
              <p className="text-sm text-muted">{pattern.description}</p>
              {pattern.estimatedDuration && (
                <p className="text-sm text-muted">Dauer: {pattern.estimatedDuration}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {pattern.motifTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-cream px-2 py-0.5 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-ink">
            <iframe
              title="YouTube"
              className="aspect-video w-full"
              src={youtubeEmbedUrl(pattern.videoId, currentStep?.timestampSec)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <a
            href={pattern.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm text-muted underline"
          >
            Auf YouTube öffnen
          </a>
          <button
            type="button"
            className="w-full text-sm text-rose"
            onClick={async () => {
              if (!confirm("Anleitung wirklich löschen?")) return;
              await deletePattern(pattern.id);
              router.push("/");
            }}
          >
            Anleitung löschen
          </button>
        </section>
      )}

      {section === "infos" && (
        <section className="space-y-4">
          {pattern.gaps.length > 0 && (
            <div className="rounded-2xl border border-rose/40 bg-rose/10 p-3 text-sm">
              <p className="font-semibold">Offene Stellen</p>
              <ul className="mt-2 list-disc pl-4">
                {pattern.gaps.map((gap, index) => (
                  <li key={`${gap.reason}-${index}`}>
                    {gap.reason}
                    {gap.suggestion ? ` — ${gap.suggestion}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-3xl bg-foam p-4 card-shadow">
            <h3 className="font-display text-xl">Material</h3>
            <ul className="mt-3 space-y-2">
              {(materials ?? []).map((material) => (
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
          </div>
          {pattern.abbreviations.length > 0 && (
            <div className="rounded-3xl bg-foam p-4 card-shadow">
              <h3 className="font-display text-xl">Abkürzungen</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {pattern.abbreviations.map((item) => (
                  <li key={item.short}>
                    <strong>{item.short}</strong> {item.meaning}
                    {item.us || item.uk ? ` (US ${item.us ?? "–"} / UK ${item.uk ?? "–"})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <CompanionStrip
            title="Begleitkarten"
            cards={companionCardsForPattern(pattern.motifTags, steps ?? [])}
          />
        </section>
      )}

      {section === "schritte" && (
        <section className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-sage transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted">
            Schritt {currentIndex + 1} von {steps?.length ?? 0} · {percent}%
          </p>
          <h3 className="font-display text-xl">Schritte</h3>
          <p className="text-sm text-muted">Tippe einen Schritt an. Vor, Zurück und Erledigt sitzen darunter.</p>
          {(steps ?? []).map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              current={index === currentIndex}
              onSelect={() => void go(index)}
              onBack={() => void go(index - 1)}
              onNext={() => void go(index + 1)}
              onToggleDone={() => void toggleDone()}
            />
          ))}
          {progress && (
            <div className="rounded-3xl bg-foam p-4 card-shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl">Reihenzähler</h3>
                <button
                  type="button"
                  className="text-sm text-terracotta"
                  onClick={() =>
                    void db.progress.put({
                      ...progress,
                      rowCounterVisible: !progress.rowCounterVisible,
                    })
                  }
                >
                  {progress.rowCounterVisible ? "Ausblenden" : "Einblenden"}
                </button>
              </div>
              {progress.rowCounterVisible ? (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    className="h-14 w-14 rounded-full bg-cream text-2xl"
                    onClick={() =>
                      void db.progress.put({
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
                      void db.progress.put({ ...progress, rowCounter: progress.rowCounter + 1 })
                    }
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  Ausgeblendet — Stand {progress.rowCounter} bleibt gespeichert.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StepCard({
  step,
  current,
  onSelect,
  onBack,
  onNext,
  onToggleDone,
}: {
  step: Step;
  current: boolean;
  onSelect: () => void;
  onBack: () => void;
  onNext: () => void;
  onToggleDone: () => void;
}) {
  const companions = current ? companionCardsForStep(step) : [];
  return (
    <article
      className={`rounded-3xl p-4 transition ${
        current
          ? "bg-terracotta text-white shadow-lg ring-4 ring-yarn/70"
          : step.done
            ? "bg-foam text-muted"
            : step.uncertain
              ? "border border-rose/40 bg-rose/10"
              : "bg-foam"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <p className={`text-xs uppercase tracking-wide ${current ? "text-cream" : "text-terracotta"}`}>
          {current ? "Jetzt dran · " : ""}
          {step.roundLabel}
          {step.done ? " · erledigt" : ""}
          {step.uncertain ? " · unsicher" : ""}
        </p>
        <p className="mt-1 font-display text-xl leading-snug">{step.instruction}</p>
        <p className={`mt-2 text-xs ${current ? "text-cream/80" : "text-muted"}`}>
          {step.stitchCount != null ? `${step.stitchCount} Maschen` : ""}
          {step.timestampSec != null ? ` · ${formatTimestamp(step.timestampSec)}` : ""}
          {step.colorChange ? ` · ${step.colorChange}` : ""}
        </p>
        {companions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {companions.map((card) => (
              <span key={card.id} className="rounded-full bg-cream px-2 py-0.5 text-xs text-ink">
                {card.title}
              </span>
            ))}
          </div>
        )}
      </button>
      {current && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-full bg-cream/95 py-3 text-sm font-semibold text-ink"
            onClick={onBack}
          >
            Zurück
          </button>
          <button
            type="button"
            className="flex-1 rounded-full bg-sage py-3 text-sm font-semibold text-white"
            onClick={onToggleDone}
          >
            {step.done ? "Offen" : "Erledigt"}
          </button>
          <button
            type="button"
            className="flex-1 rounded-full bg-cream/95 py-3 text-sm font-semibold text-ink"
            onClick={onNext}
          >
            Weiter
          </button>
        </div>
      )}
    </article>
  );
}

function SectionIcon({ icon }: { icon: "play" | "info" | "steps" }) {
  const common = {
    viewBox: "0 0 64 64",
    className: "h-10 w-10",
    fill: "none",
    stroke: "#FFF8EE",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (icon === "play") {
    return (
      <svg {...common}>
        <rect x="10" y="16" width="44" height="32" rx="6" />
        <path d="M28 24l14 8-14 8z" fill="#FFF8EE" stroke="none" />
      </svg>
    );
  }
  if (icon === "info") {
    return (
      <svg {...common}>
        <path d="M16 20h32" />
        <path d="M16 32h32" />
        <path d="M16 44h20" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M18 18h28" />
      <path d="M18 32h28" />
      <path d="M18 46h28" />
      <circle cx="14" cy="18" r="2" fill="#FFF8EE" />
      <circle cx="14" cy="32" r="2" fill="#FFF8EE" />
      <circle cx="14" cy="46" r="2" fill="#FFF8EE" />
    </svg>
  );
}
