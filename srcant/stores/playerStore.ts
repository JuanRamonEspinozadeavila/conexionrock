"use client";

import { create } from "zustand";
import type { Track } from "../types/track";

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  audio: HTMLAudioElement | null;
  currentTime: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  volume: number;
  isRepeatEnabled: boolean;
  isShuffleEnabled: boolean;

  setTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
};

function setupAudio(
  track: Track,
  set: (partial: Partial<PlayerState>) => void,
  get: () => PlayerState
) {
  const currentAudio = get().audio;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (typeof Audio === "undefined") {
    set({
      currentTrack: track,
      isPlaying: false,
      audio: null,
      currentTime: 0,
      duration: 0,
    });
    return;
  }

  const newAudio = new Audio(track.audioUrl);
  newAudio.volume = get().volume;

  newAudio.addEventListener("loadedmetadata", () => {
    set({
      duration: newAudio.duration || 0,
    });
  });

  newAudio.addEventListener("timeupdate", () => {
    set({
      currentTime: newAudio.currentTime,
    });
  });

  newAudio.addEventListener("ended", () => {
    get().playNext();
  });

  newAudio.play().catch((error) => {
    console.error("Error reproduciendo audio:", error);
    set({ isPlaying: false });
  });

  set({
    currentTrack: track,
    isPlaying: true,
    audio: newAudio,
    currentTime: 0,
    duration: 0,
  });
}

function getRandomIndex(length: number, excludeIndex: number) {
  if (length <= 1) return excludeIndex;

  let randomIndex = excludeIndex;

  while (randomIndex === excludeIndex) {
    randomIndex = Math.floor(Math.random() * length);
  }

  return randomIndex;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  audio: null,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  volume: 0.7,
  isRepeatEnabled: false,
  isShuffleEnabled: false,

  setTrack: (track, incomingQueue) => {
    const queue =
      incomingQueue && incomingQueue.length > 0 ? incomingQueue : get().queue;

    const index = queue.findIndex((item) => item.id === track.id);

    set({
      queue,
      currentIndex: index,
    });

    setupAudio(track, set, get);
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      set({ isPlaying: false });
    } else {
      audio.play().catch((error) => {
        console.error("Error reproduciendo audio:", error);
      });
      set({ isPlaying: true });
    }
  },

  setCurrentTime: (time) => {
    const { audio } = get();

    if (!audio) return;

    audio.currentTime = time;
    set({ currentTime: time });
  },

  setVolume: (volume) => {
    const safeVolume = Math.max(0, Math.min(1, volume));
    const { audio } = get();

    if (audio) {
      audio.volume = safeVolume;
    }

    set({ volume: safeVolume });
  },

  toggleRepeat: () => {
    set((state) => ({
      isRepeatEnabled: !state.isRepeatEnabled,
    }));
  },

  toggleShuffle: () => {
    set((state) => ({
      isShuffleEnabled: !state.isShuffleEnabled,
    }));
  },

  playNext: () => {
    const { queue, currentIndex, isRepeatEnabled, isShuffleEnabled } = get();

    if (queue.length === 0) return;

    if (isShuffleEnabled) {
      const randomIndex = getRandomIndex(queue.length, currentIndex);
      const randomTrack = queue[randomIndex];

      set({
        currentIndex: randomIndex,
      });

      setupAudio(randomTrack, set, get);
      return;
    }

    const isLastTrack = currentIndex + 1 >= queue.length;

    if (isLastTrack) {
      if (!isRepeatEnabled) {
        const audio = get().audio;

        if (audio) {
          audio.pause();
        }

        set({
          isPlaying: false,
          currentTime: 0,
        });

        return;
      }

      const nextTrack = queue[0];

      set({
        currentIndex: 0,
      });

      setupAudio(nextTrack, set, get);
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextTrack = queue[nextIndex];

    set({
      currentIndex: nextIndex,
    });

    setupAudio(nextTrack, set, get);
  },

  playPrevious: () => {
    const { queue, currentIndex, currentTime, audio, isRepeatEnabled } = get();

    if (queue.length === 0) return;

    if (currentTime > 3 && audio) {
      audio.currentTime = 0;
      set({ currentTime: 0 });
      return;
    }

    const previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      if (!isRepeatEnabled) return;

      const previousTrack = queue[queue.length - 1];

      set({
        currentIndex: queue.length - 1,
      });

      setupAudio(previousTrack, set, get);
      return;
    }

    const previousTrack = queue[previousIndex];

    set({
      currentIndex: previousIndex,
    });

    setupAudio(previousTrack, set, get);
  },
}));