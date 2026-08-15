"use client";

import { WorkshopView } from "@/components/workshop-view";
import { db, getSettings } from "@/lib/db";
import type { Progress } from "@/lib/types";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";

export function WorkshopLoader({ id }: { id: string }) {
  const pattern = useLiveQuery(() => db.patterns.get(id), [id]);
  const steps = useLiveQuery(
    () => db.steps.where("patternId").equals(id).sortBy("order"),
    [id],
  );
  const materials = useLiveQuery(() => db.materials.where("patternId").equals(id).toArray(), [id]);
  const stored = useLiveQuery(() => db.progress.get(id), [id]);
  const [fallback, setFallback] = useState<Progress | null>(null);

  useEffect(() => {
    if (stored) return;
    getSettings().then((settings) => {
      const progress: Progress = {
        patternId: id,
        currentStepIndex: 0,
        rowCounter: 0,
        rowCounterVisible: settings.showRowCounter,
      };
      void db.progress.put(progress);
      setFallback(progress);
    });
  }, [id, stored]);

  const progress = stored ?? fallback;

  if (!pattern || !steps || !materials || !progress) {
    return <p className="text-muted">Werkstatt wird vorbereitet …</p>;
  }

  return (
    <WorkshopView
      pattern={pattern}
      initialSteps={steps}
      initialMaterials={materials}
      initialProgress={progress}
    />
  );
}
