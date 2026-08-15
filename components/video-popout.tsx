"use client";

import { youtubeEmbedUrl } from "@/lib/youtube";
import { useEffect, useRef, useState } from "react";

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
  const startedAt = useRef(Date.now());

  useEffect(() => {
    setPlayhead(Math.max(0, startSec));
    startedAt.current = Date.now();
    setLoadId((value) => value + 1);
  }, [startSec, videoId]);

  const currentSec = () => playhead + (Date.now() - startedAt.current) / 1000;

  const seekBy = (delta: number) => {
    const next = Math.max(0, currentSec() + delta);
    setPlayhead(next);
    startedAt.current = Date.now();
    setLoadId((value) => value + 1);
  };

  const start = Math.floor(playhead);

  return (
    <div className="fixed inset-x-0 bottom-[5.75rem] z-30 mx-auto w-full max-w-lg px-4">
      <div className="overflow-hidden rounded-3xl bg-ink shadow-2xl">
        <iframe
          key={`${videoId}-${start}-${loadId}`}
          title="YouTube"
          className="aspect-video w-full bg-ink"
          src={youtubeEmbedUrl(videoId, start)}
          allow="autoplay; encrypted-media; picture-in-picture"
        />
        <div className="grid grid-cols-3 gap-2 p-3">
          <button
            type="button"
            className="rounded-2xl bg-foam py-3 text-sm font-bold text-ink"
            onClick={() => seekBy(-SEEK_SEC)}
          >
            −{SEEK_SEC} s
          </button>
          <button
            type="button"
            className="rounded-2xl bg-terracotta py-3 text-sm font-bold text-white"
            onClick={onClose}
          >
            Schließen
          </button>
          <button
            type="button"
            className="rounded-2xl bg-foam py-3 text-sm font-bold text-ink"
            onClick={() => seekBy(SEEK_SEC)}
          >
            +{SEEK_SEC} s
          </button>
        </div>
      </div>
    </div>
  );
}
