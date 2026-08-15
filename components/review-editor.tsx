"use client";

import type { ExtractedPattern } from "@/lib/types";

export function ReviewEditor({
  value,
  onChange,
}: {
  value: ExtractedPattern;
  onChange: (next: ExtractedPattern) => void;
}) {
  const updateStep = (index: number, patch: Partial<ExtractedPattern["steps"][number]>) => {
    onChange({
      ...value,
      steps: value.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    });
  };

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted">Titel</span>
        <input
          className="w-full rounded-2xl border border-line bg-foam px-3 py-2"
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted">Beschreibung</span>
        <textarea
          className="w-full rounded-2xl border border-line bg-foam px-3 py-2"
          rows={3}
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
        />
      </label>

      {value.gaps.length > 0 && (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 p-3 text-sm">
          <p className="font-semibold">Lücken prüfen</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {value.gaps.map((gap, index) => (
              <li key={`${gap.reason}-${index}`}>
                {gap.stepOrder != null ? `Schritt ${gap.stepOrder}: ` : ""}
                {gap.reason}
                {gap.suggestion ? ` — ${gap.suggestion}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted">Material</p>
        {value.materials.map((material, index) => (
          <div key={`${material.name}-${index}`} className="rounded-2xl bg-foam px-3 py-2 text-sm">
            <strong>{material.name}</strong>
            {material.quantity ? ` · ${material.quantity}` : ""}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted">{value.steps.length} Schritte</p>
        {value.steps.map((step, index) => (
          <div key={`${step.roundLabel}-${index}`} className="rounded-3xl bg-foam p-3">
            <input
              className="mb-2 w-full bg-transparent font-display text-lg"
              value={step.roundLabel}
              onChange={(event) => updateStep(index, { roundLabel: event.target.value })}
            />
            <textarea
              className="w-full rounded-2xl border border-line bg-cream/50 px-3 py-2 text-sm"
              rows={3}
              value={step.instruction}
              onChange={(event) => updateStep(index, { instruction: event.target.value })}
            />
            <div className="mt-2 flex gap-2 text-sm">
              <label className="flex items-center gap-1">
                Maschen
                <input
                  type="number"
                  className="w-20 rounded-xl border border-line px-2 py-1"
                  value={step.stitchCount ?? ""}
                  onChange={(event) =>
                    updateStep(index, {
                      stitchCount: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
