"use client";

import type { Pattern, Step } from "@/lib/types";
import { patternProgressPercent } from "@/lib/db";
import Link from "next/link";

const STATUS: Record<Pattern["status"], string> = {
  inbox: "Neu",
  in_progress: "In Arbeit",
  done: "Fertig",
};

export function PatternCard({ pattern, steps }: { pattern: Pattern; steps: Step[] }) {
  const percent = patternProgressPercent(steps);

  return (
    <Link
      href={`/pattern/${pattern.id}`}
      className="card-shadow yarn-stripe block overflow-hidden rounded-3xl bg-foam"
    >
      <div className="relative h-40 bg-line">
        {pattern.headerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pattern.headerImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🧶</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-foam/90 px-2 py-0.5 text-xs font-semibold">
          {STATUS[pattern.status]}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h2 className="font-display text-xl leading-tight">{pattern.title}</h2>
        <p className="line-clamp-2 text-sm text-muted">{pattern.description}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-sage" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted">{percent}% · {pattern.difficulty}</p>
      </div>
    </Link>
  );
}
