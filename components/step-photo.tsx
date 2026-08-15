"use client";

import { useEffect, useState } from "react";

export function StepPhoto({
  src,
  hint,
  current,
}: {
  src: string;
  hint?: string;
  current: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mt-3 w-full overflow-hidden rounded-2xl bg-ink/10 text-left"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={hint || "Abbildung aus der PDF"}
          className={`w-full object-contain object-center ${current ? "max-h-56" : "max-h-32"}`}
        />
        {hint && (
          <p className={`px-3 py-1.5 text-xs ${current ? "bg-terracotta-dark/50 text-cream" : "bg-cream text-muted"}`}>
            {hint} · tippen zum Vergrößern
          </p>
        )}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex flex-col bg-ink/95"
          role="dialog"
          aria-modal="true"
          aria-label={hint || "Abbildung"}
        >
          <button
            type="button"
            className="mx-4 mt-[max(1rem,env(safe-area-inset-top))] rounded-full bg-terracotta py-3 text-sm font-bold text-white"
            onClick={() => setOpen(false)}
          >
            Schließen
          </button>
          <div className="flex min-h-0 flex-1 items-center justify-center px-3 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={hint || "Abbildung aus der PDF"}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {hint && <p className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm text-cream">{hint}</p>}
        </div>
      )}
    </>
  );
}
