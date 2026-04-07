"use client";

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

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    setCurrentTime,
    playNext,
    playPrevious,
    volume,
    setVolume,
    isRepeatEnabled,
    toggleRepeat,
    isShuffleEnabled,
    toggleShuffle,
  } = usePlayerStore();

  const { toggleSavedTrack, isTrackSaved, hasHydrated } = useLibraryStore();

  const isSaved =
    currentTrack && hasHydrated ? isTrackSaved(currentTrack.id) : false;

  const handleToggleMute = () => {
    if (volume === 0) {
      setVolume(0.7);
    } else {
      setVolume(0);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4 shadow-2xl">
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3">
          <div className="flex min-w-0 items-center gap-4">
            {currentTrack ? (
              <>
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="h-14 w-14 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {currentTrack.title}
                  </p>
                  <p className="truncate text-sm text-zinc-400">
                    {currentTrack.artist}
                  </p>
                </div>

                <button
                  onClick={() => currentTrack && toggleSavedTrack(currentTrack)}
                  disabled={!currentTrack || !hasHydrated}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    isSaved
                      ? "border-white bg-white text-black"
                      : "border-white/10 text-white hover:bg-white/10"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                </button>
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
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  isShuffleEnabled
                    ? "border-white bg-white text-black"
                    : "border-white/10 text-white hover:bg-white/10"
                }`}
                title="Mezclar"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={toggleRepeat}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  isRepeatEnabled
                    ? "border-white bg-white text-black"
                    : "border-white/10 text-white hover:bg-white/10"
                }`}
                title="Repetir cola"
              >
                <Repeat size={18} />
              </button>

              <button
                onClick={playPrevious}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:opacity-90"
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className="flex w-full max-w-xl items-center gap-3">
              <span className="w-10 text-right text-xs text-zinc-400">
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => setCurrentTime(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer accent-white"
              />

              <span className="w-10 text-xs text-zinc-400">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 md:flex">
            <button
              onClick={handleToggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      {currentTrack && <QueueList />}
    </>
  );
}