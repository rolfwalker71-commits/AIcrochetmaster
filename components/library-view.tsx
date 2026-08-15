"use client";

import { PatternCard } from "@/components/pattern-card";
import { db } from "@/lib/db";
import type { Pattern, PatternStatus, Step } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const FILTERS: { id: "all" | PatternStatus; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "inbox", label: "Neu" },
  { id: "in_progress", label: "In Arbeit" },
  { id: "done", label: "Fertig" },
];

export function LibraryView() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  useEffect(() => {
    const load = async () => {
      setPatterns(await db.patterns.orderBy("createdAt").reverse().toArray());
      setSteps(await db.steps.toArray());
    };
    void load();
    const interval = window.setInterval(load, 2000);
    return () => window.clearInterval(interval);
  }, []);

  const stepsByPattern = useMemo(() => {
    const map = new Map<string, Step[]>();
    for (const step of steps) {
      const list = map.get(step.patternId) ?? [];
      list.push(step);
      map.set(step.patternId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  }, [steps]);

  const visible = patterns.filter((pattern) => {
    if (filter !== "all" && pattern.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${pattern.title} ${pattern.description} ${pattern.motifTags.join(" ")}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-4">
      <input
        className="w-full rounded-2xl border border-line bg-foam px-3 py-2"
        placeholder="Anleitungen suchen …"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === item.id ? "bg-ink text-cream" : "bg-foam"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState hasAny={patterns.length > 0} />
      ) : (
        <div className="grid gap-4">
          {visible.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              steps={stepsByPattern.get(pattern.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-3xl bg-foam p-6 text-center card-shadow">
      <p className="text-5xl">🧶</p>
      <h2 className="mt-3 font-display text-2xl">
        {hasAny ? "Nichts zu diesem Filter" : "Noch keine Anleitung"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Teile ein YouTube-Häkelvideo oder füge den Link ein. Daraus wird eine lückenlose
        Schriftanleitung mit Headerbild.
      </p>
      <Link
        href="/import"
        className="mt-4 inline-block rounded-full bg-terracotta px-4 py-2 font-semibold text-white"
      >
        Erstes Video importieren
      </Link>
    </div>
  );
}
