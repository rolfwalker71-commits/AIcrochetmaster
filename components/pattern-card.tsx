"use client";

import type { Pattern, Step } from "@/lib/types";
import { deletePattern, patternProgressPercent } from "@/lib/db";
import Link from "next/link";

const STATUS: Record<Pattern["status"], string> = {
  inbox: "Neu",
  in_progress: "In Arbeit",
  done: "Fertig",
};

export function PatternCard({ pattern, steps }: { pattern: Pattern; steps: Step[] }) {
  const percent = patternProgressPercent(steps);

  return (
    <div className="card-shadow yarn-stripe relative overflow-hidden rounded-3xl bg-foam">
      <Link href={`/pattern/${pattern.id}`} className="block">
        <div className="relative h-40 bg-line">
          {pattern.headerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pattern.headerImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl" aria-hidden>
              🧶
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-foam/90 px-2 py-0.5 text-xs font-semibold">
            {STATUS[pattern.status]}
          </span>
        </div>
        <div className="space-y-2 p-4">
          <h2 className="font-display text-xl leading-tight">{pattern.title}</h2>
          <p className="line-clamp-2 text-sm text-muted">{pattern.description}</p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Fortschritt"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="h-full bg-sage" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted">{percent}% · {pattern.difficulty}</p>
        </div>
      </Link>
      <button
        type="button"
        aria-label="Anleitung löschen"
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-foam/95 text-rose shadow-sm"
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!confirm(`„${pattern.title}“ wirklich aus der Bibliothek löschen?`)) return;
          await deletePattern(pattern.id);
        }}
      >
        <TrashGlyph />
      </button>
    </div>
  );
}

function TrashGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 7h14" />
      <path d="M10 7V5h4v2" />
      <path d="M8 7l1 13h6l1-13" />
    </svg>
  );
}
