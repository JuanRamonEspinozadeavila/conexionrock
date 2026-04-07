"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { formatTime } from "@/lib/formatTime";
import QueueList from "./QueueList";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Music2,
  Heart,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
} from "lucide-react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PlayerBar() {
  const [mounted, setMounted] = useState(false);
  const lastVolumeRef = useRef(0.7);

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const isRepeatEnabled = usePlayerStore((state) => state.isRepeatEnabled);
  const toggleRepeat = usePlayerStore((state) => state.toggleRepeat);
  const isShuffleEnabled = usePlayerStore((state) => state.isShuffleEnabled);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const toggleSavedTrack = useLibraryStore((state) => state.toggleSavedTrack);
  const isTrackSaved = useLibraryStore((state) => state.isTrackSaved);
  const hasHydrated = useLibraryStore((state) => state.hasHydrated);

  useEffect(() => {
    setMounted(true);

    if (!useLibraryStore.persist.hasHydrated()) {
      useLibraryStore.persist.rehydrate();
    }
  }, []);

  useEffect(() => {
    const safeVolume = clamp(Number(volume) || 0, 0, 1);

    if (safeVolume > 0) {
      lastVolumeRef.current = safeVolume;
    }
  }, [volume]);

  const safeCurrentTrack = mounted ? currentTrack : null;
  const safeIsPlaying = mounted ? isPlaying : false;
  const safeDuration = mounted ? Math.max(0, Number(duration) || 0) : 0;
  const safeCurrentTime = mounted
    ? clamp(Number(currentTime) || 0, 0, Math.max(0, Number(duration) || 0))
    : 0;
  const safeVolume = mounted ? clamp(Number(volume) || 0, 0, 1) : 0.7;
  const safeRepeatEnabled = mounted ? isRepeatEnabled : false;
  const safeShuffleEnabled = mounted ? isShuffleEnabled : false;

  // 🔥 CLAVE: soportar track o podcast
  const subtitle = useMemo(() => {
    if (!safeCurrentTrack) return "";

    if (safeCurrentTrack.type === "track") {
      return safeCurrentTrack.artist;
    }

    return (
      safeCurrentTrack.author ||
      safeCurrentTrack.podcastTitle ||
      "Podcast"
    );
  }, [safeCurrentTrack]);

  const isSaved = useMemo(() => {
    if (!mounted || !safeCurrentTrack || !hasHydrated) return false;

    // ⚠️ solo aplica a tracks (por ahora)
    if (safeCurrentTrack.type !== "track") return false;

    return isTrackSaved(safeCurrentTrack.id);
  }, [mounted, safeCurrentTrack, hasHydrated, isTrackSaved]);

  const handleToggleMute = () => {
    if (safeVolume === 0) {
      setVolume(lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.7);
      return;
    }

    lastVolumeRef.current = safeVolume;
    setVolume(0);
  };

  const handleSeek = (value: string) => {
    const nextTime = clamp(Number(value) || 0, 0, safeDuration);
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (value: string) => {
    const nextVolume = clamp(Number(value) || 0, 0, 1);
    setVolume(nextVolume);
  };

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4 shadow-2xl">
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
              <Music2 size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">
                Selecciona una canción para empezar
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border border-white/10 bg-zinc-900" />
              <div className="h-10 w-10 rounded-full border border-white/10 bg-zinc-900" />
              <div className="h-10 w-10 rounded-full border border-white/10 bg-zinc-900" />
              <div className="h-11 w-11 rounded-full border border-white/10 bg-zinc-800" />
              <div className="h-10 w-10 rounded-full border border-white/10 bg-zinc-900" />
            </div>

            <div className="flex w-full max-w-xl items-center gap-3">
              <span className="w-10 text-right text-xs text-zinc-500">0:00</span>
              <div className="h-1 flex-1 rounded-full bg-zinc-800" />
              <span className="w-10 text-xs text-zinc-500">0:00</span>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 md:flex">
            <div className="h-10 w-10 rounded-full border border-white/10 bg-zinc-900" />
            <div className="h-1 w-24 rounded-full bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4 shadow-2xl">
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
          <div className="flex min-w-0 items-center gap-4">
            {safeCurrentTrack ? (
              <>
                <img
                  src={safeCurrentTrack.coverUrl || "/placeholder-cover.jpg"}
                  alt={safeCurrentTrack.title}
                  className="h-14 w-14 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {safeCurrentTrack.title}
                  </p>
                  <p className="truncate text-sm text-zinc-400">
                    {subtitle}
                  </p>
                </div>

                {safeCurrentTrack.type === "track" && (
                  <button
                    onClick={() =>
                      safeCurrentTrack && toggleSavedTrack(safeCurrentTrack)
                    }
                    disabled={!safeCurrentTrack || !hasHydrated}
                    type="button"
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      isSaved
                        ? "border-white/10 bg-zinc-800 text-zinc-100"
                        : "border-white/10 text-white hover:bg-white/10"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title={
                      isSaved
                        ? "Quitar de favoritas"
                        : "Guardar en favoritas"
                    }
                  >
                    <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
                  <Music2 size={20} />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">
                    Selecciona una canción para empezar
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={toggleShuffle}
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  safeShuffleEnabled
                    ? "border-white/10 bg-zinc-800 text-zinc-100"
                    : "border-white/10 text-white hover:bg-white/10"
                }`}
                title="Mezclar"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={toggleRepeat}
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  safeRepeatEnabled
                    ? "border-white/10 bg-zinc-800 text-zinc-100"
                    : "border-white/10 text-white hover:bg-white/10"
                }`}
                title="Repetir cola"
              >
                <Repeat size={18} />
              </button>

              <button
                onClick={playPrevious}
                type="button"
                disabled={!safeCurrentTrack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                type="button"
                disabled={!safeCurrentTrack}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {safeIsPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                type="button"
                disabled={!safeCurrentTrack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className="flex w-full max-w-xl items-center gap-3">
              <span className="w-10 text-right text-xs text-zinc-400">
                {formatTime(safeCurrentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={safeDuration}
                value={safeCurrentTime}
                onChange={(e) => handleSeek(e.target.value)}
                disabled={!safeCurrentTrack || safeDuration <= 0}
                className="h-1 flex-1 cursor-pointer accent-white disabled:cursor-not-allowed disabled:opacity-50"
              />

              <span className="w-10 text-xs text-zinc-400">
                {formatTime(safeDuration)}
              </span>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 md:flex">
            <button
              onClick={handleToggleMute}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
            >
              {safeVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={safeVolume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className="w-24 cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      {mounted && safeCurrentTrack ? <QueueList /> : null}
    </>
  );
}