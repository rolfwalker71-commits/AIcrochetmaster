"use client";

import { PatternCard } from "@/components/pattern-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { PatternStatus, Step } from "@/lib/types";
import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const FILTERS: { id: "all" | PatternStatus; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "inbox", label: "Neu" },
  { id: "in_progress", label: "In Arbeit" },
  { id: "done", label: "Fertig" },
];

export function LibraryView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const patterns = useLiveQuery(() => db.patterns.orderBy("createdAt").reverse().toArray(), []) ?? [];
  const steps = useLiveQuery(() => db.steps.toArray(), []) ?? [];

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
      <h1 className="font-heading text-2xl">Bibliothek</h1>
      <label className="block">
        <span className="sr-only">Figuren suchen</span>
        <Input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Figuren suchen …"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={filter === item.id ? "default" : "outline"}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className="shrink-0 rounded-full"
          >
            {item.label}
          </Button>
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
    <Card className="rounded-3xl text-center">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {hasAny ? "Nichts zu diesem Filter" : "Noch keine Figur"}
        </CardTitle>
        <CardDescription>
          Importierte YouTube- und PDF-Amigurumi-Anleitungen erscheinen hier, sobald die Analyse fertig ist.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2 pb-6">
        <Button asChild>
          <Link href="/import" className="gap-2">
            <Plus className="size-4" />
            Video oder PDF holen
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cards" className="gap-2">
            <BookOpen className="size-4" />
            Motivkarten öffnen
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
