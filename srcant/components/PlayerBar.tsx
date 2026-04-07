"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatDuration } from "@/lib/formatDuration";

export default function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLooping,
    isShuffling,
    togglePlay,
    playNext,
    playPrev,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleLoop,
    toggleShuffle,
  } = usePlayerStore();

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onEnded = () => {
      if (isLooping) return;
      playNext();
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack, isLooping, playNext, setCurrentTime, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (Math.abs(audio.currentTime - currentTime) > 1) {
      audio.currentTime = currentTime;
    }
  }, [currentTime, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolume = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = value;
    setVolume(value);
  };

  if (!currentTrack) {
    return (
      <>
        <audio ref={audioRef} preload="metadata" />
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-400">
          No hay nada reproduciéndose
        </div>
      </>
    );
  }

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="h-14 w-14 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{currentTrack.title}</p>
              <p className="truncate text-xs text-zinc-400">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex w-full max-w-2xl flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                className={`text-sm ${isShuffling ? "text-green-500" : "text-zinc-400"}`}
              >
                Shuffle
              </button>

              <button
                onClick={playPrev}
                className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
              >
                Prev
              </button>

              <button
                onClick={togglePlay}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                onClick={playNext}
                className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
              >
                Next
              </button>

              <button
                onClick={toggleLoop}
                className={`text-sm ${isLooping ? "text-green-500" : "text-zinc-400"}`}
              >
                Loop
              </button>
            </div>

            <div className="flex w-full items-center gap-3">
              <span className="w-12 text-right text-xs text-zinc-400">
                {formatDuration(currentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full"
              />

              <span className="w-12 text-xs text-zinc-400">
                {formatDuration(duration)}
              </span>
            </div>

            <div className="h-1 w-full rounded bg-zinc-800">
              <div
                className="h-1 rounded bg-white transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex min-w-[140px] items-center justify-end gap-2">
            <span className="text-xs text-zinc-400">Vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </>
  );
}