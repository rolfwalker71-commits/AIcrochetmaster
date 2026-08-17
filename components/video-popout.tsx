"use client";

import { Button } from "@/components/ui/button";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { useRef, useState } from "react";

const SEEK_SEC = 10;

export function VideoPopout({
  videoId,
  startSec,
  onClose,
}: {
  videoId: string;
  startSec: number;
  onClose: () => void;
}) {
  const [playhead, setPlayhead] = useState(() => Math.max(0, startSec));
  const [loadId, setLoadId] = useState(0);
  const startedAt = useRef(0);

  const markStart = (next: number) => {
    setPlayhead(next);
    startedAt.current = performance.now();
    setLoadId((value) => value + 1);
  };

  const currentSec = () => {
    const elapsed = startedAt.current === 0 ? 0 : (performance.now() - startedAt.current) / 1000;
    return playhead + elapsed;
  };

  const seekBy = (delta: number) => {
    markStart(Math.max(0, currentSec() + delta));
  };

  const start = Math.floor(playhead);

  return (
    <div className="fixed inset-x-0 bottom-[5.75rem] z-30 mx-auto w-full max-w-lg px-4">
      <div className="overflow-hidden rounded-3xl bg-foreground shadow-2xl">
        <iframe
          key={`${videoId}-${start}-${loadId}`}
          title={`YouTube: ${videoId}`}
          className="aspect-video w-full bg-foreground"
          src={youtubeEmbedUrl(videoId, start)}
          allow="autoplay; encrypted-media; picture-in-picture"
        />
        <div className="grid grid-cols-3 gap-2 p-3">
          <Button
            type="button"
            variant="secondary"
            aria-label={`${SEEK_SEC} Sekunden zurück`}
            onClick={() => seekBy(-SEEK_SEC)}
          >
            −{SEEK_SEC} s
          </Button>
          <Button type="button" onClick={onClose}>
            Schließen
          </Button>
          <Button
            type="button"
            variant="secondary"
            aria-label={`${SEEK_SEC} Sekunden vor`}
            onClick={() => seekBy(SEEK_SEC)}
          >
            +{SEEK_SEC} s
          </Button>
        </div>
      </div>
    </div>
  );
}
