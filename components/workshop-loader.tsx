"use client";

import { PatternStudio } from "@/components/pattern-studio";

export function WorkshopLoader({ id }: { id: string }) {
  return <PatternStudio id={id} initialSection="schritte" />;
}
