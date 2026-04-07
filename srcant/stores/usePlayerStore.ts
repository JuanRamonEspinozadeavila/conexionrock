"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
};

type PlayerState = {
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;

  currentTime: number;
  duration: number;

  volume: number;
  isLooping: boolean;
  isShuffling: boolean;

  playTrack: (track: Track, queue?: Track[]) => void;
  setQueue: (queue: Track[], startIndex?: number) => void;

  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;

  setCurrentTime: (time: number) => void;
  setDuration: (time: number) => void;

  setVolume: (value: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
};

function getRandomIndex(length: number, exclude?: number) {
  if (length <= 1) return 0;

  let next = Math.floor(Math.random() * length);
  while (next === exclude) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,

      currentTime: 0,
      duration: 0,

      volume: 1,
      isLooping: false,
      isShuffling: false,

      playTrack: (track, queueArg) => {
        const nextQueue = queueArg && queueArg.length > 0 ? queueArg : [track];
        const foundIndex = nextQueue.findIndex((t) => t.id === track.id);
        const nextIndex = foundIndex >= 0 ? foundIndex : 0;

        set({
          queue: nextQueue,
          currentIndex: nextIndex,
          currentTrack: nextQueue[nextIndex],
          isPlaying: true,
          currentTime: 0,
          duration: nextQueue[nextIndex]?.duration ?? 0,
        });
      },

      setQueue: (queue, startIndex = 0) => {
        const safeIndex =
          queue.length === 0 ? -1 : Math.min(Math.max(startIndex, 0), queue.length - 1);

        set({
          queue,
          currentIndex: safeIndex,
          currentTrack: safeIndex >= 0 ? queue[safeIndex] : null,
          currentTime: 0,
          duration: safeIndex >= 0 ? queue[safeIndex]?.duration ?? 0 : 0,
        });
      },

      togglePlay: () => {
        const { currentTrack, isPlaying } = get();
        if (!currentTrack) return;
        set({ isPlaying: !isPlaying });
      },

      playNext: () => {
        const { queue, currentIndex, isShuffling } = get();
        if (queue.length === 0) return;

        let nextIndex = currentIndex;

        if (isShuffling) {
          nextIndex = getRandomIndex(queue.length, currentIndex);
        } else {
          nextIndex = currentIndex + 1;
          if (nextIndex >= queue.length) {
            nextIndex = 0;
          }
        }

        set({
          currentIndex: nextIndex,
          currentTrack: queue[nextIndex],
          isPlaying: true,
          currentTime: 0,
          duration: queue[nextIndex]?.duration ?? 0,
        });
      },

      playPrev: () => {
        const { queue, currentIndex, currentTime } = get();
        if (queue.length === 0) return;

        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }

        set({
          currentIndex: prevIndex,
          currentTrack: queue[prevIndex],
          isPlaying: true,
          currentTime: 0,
          duration: queue[prevIndex]?.duration ?? 0,
        });
      },

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (time) => set({ duration: time }),

      setVolume: (value) => set({ volume: value }),
      toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
      toggleShuffle: () => set((state) => ({ isShuffling: !state.isShuffling })),
    }),
    {
      name: "player-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        isLooping: state.isLooping,
        isShuffling: state.isShuffling,
      }),
    }
  )
);