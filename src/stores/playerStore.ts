"use client";

import { create } from "zustand";
import type { PlayableItem } from "@/types/track";


const PLAYER_VOLUME_KEY = "player-volume";
const PLAYER_REPEAT_KEY = "player-repeat";
const PLAYER_SHUFFLE_KEY = "player-shuffle";

type PlayerState = {
  currentTrack: PlayableItem | null;
  isPlaying: boolean;
  audio: HTMLAudioElement | null;
  currentTime: number;
  duration: number;
  queue: PlayableItem[];
  currentIndex: number;
  volume: number;
  isRepeatEnabled: boolean;
  isShuffleEnabled: boolean;

  setTrack: (track: PlayableItem, queue?: PlayableItem[]) => void;
  setQueue: (queue: PlayableItem[]) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isValidAudioUrl(value?: string | null) {
  return !!value?.trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readStoredVolume() {
  if (!isBrowser()) return 0.7;

  const raw = window.localStorage.getItem(PLAYER_VOLUME_KEY);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return 0.7;
  return clamp(parsed, 0, 1);
}

function readStoredBoolean(key: string, fallback = false) {
  if (!isBrowser()) return fallback;

  const raw = window.localStorage.getItem(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

function writeStorageValue(key: string, value: string) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error(`No se pudo guardar ${key} en localStorage:`, error);
  }
}

function cleanupAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;

  audio.onloadedmetadata = null;
  audio.ontimeupdate = null;
  audio.onended = null;
  audio.onerror = null;

  audio.src = "";
  audio.load();
}

function getSafeQueue(
  track: PlayableItem,
  incomingQueue: PlayableItem[] | undefined,
  currentQueue: PlayableItem[]
) {
  const baseQueue =
    incomingQueue && incomingQueue.length > 0 ? incomingQueue : currentQueue;

  if (baseQueue.length === 0) {
    return [track];
  }

  const exists = baseQueue.some((item) => item.id === track.id);

  if (exists) return baseQueue;

  return [track, ...baseQueue];
}

function getRandomIndex(length: number, excludeIndex: number) {
  if (length <= 1) return 0;

  let randomIndex = excludeIndex;

  while (randomIndex === excludeIndex) {
    randomIndex = Math.floor(Math.random() * length);
  }

  return randomIndex;
}

function setupAudio(
  item: PlayableItem,
  set: (partial: Partial<PlayerState>) => void,
  get: () => PlayerState
) {
  if (!isValidAudioUrl(item.audioUrl)) {
    console.error("Item sin audioUrl válida:", item);
    set({
      isPlaying: false,
    });
    return;
  }

  const currentAudio = get().audio;
  cleanupAudio(currentAudio);

  const newAudio = new Audio(item.audioUrl);
  newAudio.preload = "metadata";
  newAudio.volume = get().volume;

  newAudio.onloadedmetadata = () => {
    if (get().audio !== newAudio) return;

    set({
      duration: Number.isFinite(newAudio.duration) ? newAudio.duration : 0,
    });
  };

  newAudio.ontimeupdate = () => {
    if (get().audio !== newAudio) return;

    set({
      currentTime: newAudio.currentTime,
    });
  };

  newAudio.onended = () => {
    if (get().audio !== newAudio) return;
    get().playNext();
  };

  newAudio.onerror = () => {
    if (get().audio !== newAudio) return;

    console.error("Error cargando audio:", item.audioUrl);
    set({
      isPlaying: false,
    });
  };

  set({
    currentTrack: item,
    audio: newAudio,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  });

  void newAudio
    .play()
    .then(() => {
      if (get().audio !== newAudio) return;

      set({
        isPlaying: true,
      });
    })
    .catch((error) => {
      if (get().audio !== newAudio) return;

      console.error("Error reproduciendo:", error);
      set({
        isPlaying: false,
      });
    });
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  audio: null,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  volume: readStoredVolume(),
  isRepeatEnabled: readStoredBoolean(PLAYER_REPEAT_KEY, false),
  isShuffleEnabled: readStoredBoolean(PLAYER_SHUFFLE_KEY, false),

  setTrack: (track, incomingQueue) => {
    if (!isValidAudioUrl(track.audioUrl)) {
      console.error("No se puede reproducir item sin audioUrl:", track);
      return;
    }

    const safeQueue = getSafeQueue(track, incomingQueue, get().queue);
    const nextIndex = safeQueue.findIndex((item) => item.id === track.id);

    set({
      queue: safeQueue,
      currentIndex: nextIndex,
    });

    setupAudio(track, set, get);
  },

  setQueue: (queue) => {
    const { currentTrack } = get();

    const nextIndex = currentTrack
      ? queue.findIndex((item) => item.id === currentTrack.id)
      : -1;

    set({
      queue,
      currentIndex: nextIndex,
    });
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      set({ isPlaying: false });
      return;
    }

    void audio
      .play()
      .then(() => {
        set({ isPlaying: true });
      })
      .catch((error) => {
        console.error("Error reanudando audio:", error);
        set({ isPlaying: false });
      });
  },

  setCurrentTime: (time) => {
    const { audio, duration } = get();

    if (!audio) return;

    const safeTime = clamp(time, 0, duration || time);

    audio.currentTime = safeTime;
    set({
      currentTime: safeTime,
    });
  },

  setVolume: (volume) => {
    const safeVolume = clamp(Number(volume) || 0, 0, 1);
    const { audio } = get();

    if (audio) {
      audio.volume = safeVolume;
    }

    writeStorageValue(PLAYER_VOLUME_KEY, String(safeVolume));

    set({
      volume: safeVolume,
    });
  },

  toggleRepeat: () => {
    const nextValue = !get().isRepeatEnabled;

    writeStorageValue(PLAYER_REPEAT_KEY, String(nextValue));

    set({
      isRepeatEnabled: nextValue,
    });
  },

  toggleShuffle: () => {
    const nextValue = !get().isShuffleEnabled;

    writeStorageValue(PLAYER_SHUFFLE_KEY, String(nextValue));

    set({
      isShuffleEnabled: nextValue,
    });
  },

  playNext: () => {
    const { queue, currentIndex, isRepeatEnabled, isShuffleEnabled } = get();

    if (queue.length === 0) return;

    if (isShuffleEnabled) {
      const randomIndex =
        currentIndex >= 0
          ? getRandomIndex(queue.length, currentIndex)
          : Math.floor(Math.random() * queue.length);

      const randomItem = queue[randomIndex];
      if (!randomItem) return;

      set({
        currentIndex: randomIndex,
      });

      setupAudio(randomItem, set, get);
      return;
    }

    if (currentIndex < 0) {
      const firstItem = queue[0];
      if (!firstItem) return;

      set({
        currentIndex: 0,
      });

      setupAudio(firstItem, set, get);
      return;
    }

    const isLast = currentIndex + 1 >= queue.length;

    if (isLast) {
      if (!isRepeatEnabled) {
        const audio = get().audio;

        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }

        set({
          isPlaying: false,
          currentTime: 0,
        });

        return;
      }

      const firstItem = queue[0];
      if (!firstItem) return;

      set({
        currentIndex: 0,
      });

      setupAudio(firstItem, set, get);
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextItem = queue[nextIndex];

    if (!nextItem) return;

    set({
      currentIndex: nextIndex,
    });

    setupAudio(nextItem, set, get);
  },

  playPrevious: () => {
    const { queue, currentIndex, currentTime, audio, isRepeatEnabled } = get();

    if (queue.length === 0) return;

    if (currentTime > 3 && audio) {
      audio.currentTime = 0;
      set({
        currentTime: 0,
      });
      return;
    }

    if (currentIndex < 0) {
      const firstItem = queue[0];
      if (!firstItem) return;

      set({
        currentIndex: 0,
      });

      setupAudio(firstItem, set, get);
      return;
    }

    const previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      if (!isRepeatEnabled) {
        const firstItem = queue[0];
        if (!firstItem) return;

        set({
          currentIndex: 0,
        });

        setupAudio(firstItem, set, get);
        return;
      }

      const lastItem = queue[queue.length - 1];
      if (!lastItem) return;

      set({
        currentIndex: queue.length - 1,
      });

      setupAudio(lastItem, set, get);
      return;
    }

    const previousItem = queue[previousIndex];
    if (!previousItem) return;

    set({
      currentIndex: previousIndex,
    });

    setupAudio(previousItem, set, get);
  },
}));