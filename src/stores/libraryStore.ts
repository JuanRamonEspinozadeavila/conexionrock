import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/types/track";

type LibraryState = {
  savedTracks: Track[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  toggleSavedTrack: (track: Track) => void;
  isTrackSaved: (trackId: string) => boolean;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      savedTracks: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      toggleSavedTrack: (track) => {
        const { savedTracks } = get();
        const exists = savedTracks.some((item) => item.id === track.id);

        if (exists) {
          set({
            savedTracks: savedTracks.filter((item) => item.id !== track.id),
          });
          return;
        }

        set({
          savedTracks: [...savedTracks, track],
        });
      },

      isTrackSaved: (trackId) => {
        return get().savedTracks.some((item) => item.id === trackId);
      },
    }),
    {
      name: "library-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);