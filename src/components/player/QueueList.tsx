"use client";

import { useMemo } from "react";
import { usePlayerStore } from "@/stores/playerStore";

export default function QueueList() {
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const setTrack = usePlayerStore((state) => state.setTrack);

  const hasValidCurrentTrack =
    !!currentTrack &&
    Array.isArray(queue) &&
    currentIndex >= 0 &&
    currentIndex < queue.length;

  const nextTracks = useMemo(() => {
    if (!hasValidCurrentTrack) return [];
    return queue.slice(currentIndex + 1, currentIndex + 6);
  }, [queue, currentIndex, hasValidCurrentTrack]);

  if (!hasValidCurrentTrack || nextTracks.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        A continuación
      </p>

      <div className="space-y-2">
        {nextTracks.map((track, index) => {
          const isNext = index === 0;

          const subtitle =
            track.type === "track"
              ? track.artist
              : track.author || track.podcastTitle || "Podcast";

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => setTrack(track, queue)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isNext
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              <img
                src={track.coverUrl || "/placeholder-cover.jpg"}
                alt={track.title}
                className="h-10 w-10 rounded-lg object-cover"
              />

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    isNext ? "text-black" : "text-white"
                  }`}
                >
                  {track.title}
                </p>
                <p
                  className={`truncate text-xs ${
                    isNext ? "text-zinc-700" : "text-zinc-400"
                  }`}
                >
                  {subtitle}
                </p>
              </div>

              <span
                className={`text-xs font-medium ${
                  isNext ? "text-zinc-700" : "text-zinc-500"
                }`}
              >
                #{currentIndex + index + 2}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}