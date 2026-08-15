"use client";

import { db, deletePattern } from "@/lib/db";
import { formatTimestamp, youtubeEmbedUrl } from "@/lib/youtube";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PatternDetail({ id }: { id: string }) {
  const router = useRouter();
  const pattern = useLiveQuery(() => db.patterns.get(id), [id]);
  const steps = useLiveQuery(
    () => db.steps.where("patternId").equals(id).sortBy("order"),
    [id],
  );
  const materials = useLiveQuery(() => db.materials.where("patternId").equals(id).toArray(), [id]);

  if (pattern === undefined) return <p className="text-muted">Wird geladen …</p>;
  if (!pattern) return <p>Anleitung nicht gefunden.</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-foam card-shadow">
        {pattern.headerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pattern.headerImage} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-36 items-center justify-center bg-line text-5xl">🧶</div>
        )}
        <div className="space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-terracotta">{pattern.difficulty}</p>
          <h2 className="font-display text-3xl leading-tight">{pattern.title}</h2>
          <p className="text-sm text-muted">{pattern.description}</p>
          {pattern.estimatedDuration && (
            <p className="text-sm text-muted">Dauer: {pattern.estimatedDuration}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {pattern.motifTags.map((tag) => (
              <span key={tag} className="rounded-full bg-cream px-2 py-0.5 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/workshop/${pattern.id}`}
          className="rounded-full bg-terracotta py-3 text-center font-semibold text-white"
        >
          Werkstatt
        </Link>
        <a
          href={pattern.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line py-3 text-center font-semibold"
        >
          YouTube
        </a>
      </div>

      <div className="overflow-hidden rounded-3xl bg-ink">
        <iframe
          title="YouTube"
          className="aspect-video w-full"
          src={youtubeEmbedUrl(pattern.videoId)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {pattern.gaps.length > 0 && (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 p-3 text-sm">
          <p className="font-semibold">Offene Stellen</p>
          <ul className="mt-2 list-disc pl-4">
            {pattern.gaps.map((gap, index) => (
              <li key={`${gap.reason}-${index}`}>
                {gap.reason}
                {gap.suggestion ? ` — ${gap.suggestion}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-3xl bg-foam p-4">
        <h3 className="font-display text-xl">Material</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {(materials ?? []).map((material) => (
            <li key={material.id}>
              <strong>{material.name}</strong>
              {material.quantity ? ` · ${material.quantity}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {pattern.abbreviations.length > 0 && (
        <section className="rounded-3xl bg-foam p-4">
          <h3 className="font-display text-xl">Abkürzungen</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {pattern.abbreviations.map((item) => (
              <li key={item.short}>
                <strong>{item.short}</strong> {item.meaning}
                {item.us || item.uk ? ` (US ${item.us ?? "–"} / UK ${item.uk ?? "–"})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-display text-xl">Schritte</h3>
        {(steps ?? []).map((step) => (
          <article key={step.id} className="rounded-3xl bg-foam p-4">
            <p className="text-xs uppercase tracking-wide text-terracotta">{step.roundLabel}</p>
            <p className="mt-1">{step.instruction}</p>
            <p className="mt-2 text-xs text-muted">
              {step.stitchCount != null ? `${step.stitchCount} Maschen` : ""}
              {step.timestampSec != null ? ` · ${formatTimestamp(step.timestampSec)}` : ""}
              {step.colorChange ? ` · ${step.colorChange}` : ""}
            </p>
          </article>
        ))}
      </section>

      <button
        type="button"
        className="w-full text-sm text-rose"
        onClick={async () => {
          if (!confirm("Anleitung wirklich löschen?")) return;
          await deletePattern(pattern.id);
          router.push("/");
        }}
      >
        Anleitung löschen
      </button>
    </div>
  );
}
