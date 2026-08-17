"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="space-y-2">
        <Label htmlFor="review-title">Titel</Label>
        <Input
          id="review-title"
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-description">Beschreibung</Label>
        <Textarea
          id="review-description"
          rows={3}
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
        />
      </div>

      {value.gaps.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Lücken prüfen</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {value.gaps.map((gap, index) => (
                <li key={`${gap.reason}-${index}`}>
                  {gap.stepOrder != null ? `Schritt ${gap.stepOrder}: ` : ""}
                  {gap.reason}
                  {gap.suggestion ? ` — ${gap.suggestion}` : ""}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Material</p>
        {value.materials.map((material, index) => (
          <Card key={`${material.name}-${index}`} size="sm">
            <CardContent className="text-sm">
              <strong>{material.name}</strong>
              {material.quantity ? ` · ${material.quantity}` : ""}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{value.steps.length} Schritte</p>
        {value.steps.map((step, index) => (
          <Card key={`${step.roundLabel}-${index}`} className="rounded-3xl">
            <CardContent className="space-y-2">
              <Input
                className="border-0 bg-transparent font-heading text-lg shadow-none"
                value={step.roundLabel}
                onChange={(event) => updateStep(index, { roundLabel: event.target.value })}
                aria-label={`Rundenbezeichnung Schritt ${index + 1}`}
              />
              <Textarea
                rows={3}
                value={step.instruction}
                onChange={(event) => updateStep(index, { instruction: event.target.value })}
                aria-label={`Anweisung Schritt ${index + 1}`}
              />
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor={`stitches-${index}`}>Maschen</Label>
                <Input
                  id={`stitches-${index}`}
                  type="number"
                  className="w-24"
                  value={step.stitchCount ?? ""}
                  onChange={(event) =>
                    updateStep(index, {
                      stitchCount: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
