"use client";

import { PatternStudio } from "@/components/pattern-studio";

export function PatternDetail({ id }: { id: string }) {
  return <PatternStudio id={id} initialSection="projekt" />;
}
