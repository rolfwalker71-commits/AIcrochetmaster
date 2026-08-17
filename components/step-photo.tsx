"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="mt-3 h-auto w-full overflow-hidden rounded-2xl bg-foreground/10 p-0 text-left whitespace-normal hover:bg-foreground/10"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={hint || "Abbildung aus der PDF"}
          className={`w-full object-contain object-center ${current ? "max-h-56" : "max-h-32"}`}
        />
        {hint && (
          <p
            className={`px-3 py-1.5 text-xs ${
              current ? "bg-primary/50 text-primary-foreground" : "bg-background text-muted-foreground"
            }`}
          >
            {hint} · tippen zum Vergrößern
          </p>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>{hint || "Abbildung"}</DialogTitle>
            <DialogDescription>Tippe außerhalb oder auf Schließen, um zurückzukehren.</DialogDescription>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={hint || "Abbildung aus der PDF"}
            className="max-h-[70dvh] w-full object-contain"
          />
          <Button type="button" className="w-full" onClick={() => setOpen(false)}>
            Schließen
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
