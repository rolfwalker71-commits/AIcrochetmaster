"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Pattern, Step } from "@/lib/types";
import { deletePattern, patternProgressPercent } from "@/lib/db";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATUS: Record<Pattern["status"], string> = {
  inbox: "Neu",
  in_progress: "In Arbeit",
  done: "Fertig",
};

export function PatternCard({ pattern, steps }: { pattern: Pattern; steps: Step[] }) {
  const percent = patternProgressPercent(steps);
  const [open, setOpen] = useState(false);

  return (
    <Card className="yarn-stripe relative overflow-hidden rounded-3xl py-0">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Anleitung löschen"
            className="absolute top-3 right-3 z-10 bg-card/95 text-destructive hover:bg-card"
          >
            <Trash2 className="size-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anleitung löschen?</DialogTitle>
            <DialogDescription>
              „{pattern.title}“ wirklich aus der Bibliothek löschen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                await deletePattern(pattern.id);
                setOpen(false);
              }}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Link href={`/pattern/${pattern.id}`} className="block">
        <div className="relative h-40 bg-muted">
          {pattern.headerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pattern.headerImage}
              alt={`Vorschaubild: ${pattern.title}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground" aria-hidden>
              <span className="font-heading text-4xl">Häkel</span>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-card/90 text-foreground hover:bg-card/90">
            {STATUS[pattern.status]}
          </Badge>
        </div>
        <CardHeader className="space-y-2">
          <CardTitle className="font-heading text-xl leading-tight">{pattern.title}</CardTitle>
          <CardDescription className="line-clamp-2">{pattern.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <Progress value={percent} aria-label="Fortschritt" />
          <p className="text-xs text-muted-foreground">
            {percent}% · {pattern.difficulty}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
