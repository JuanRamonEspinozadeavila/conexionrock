import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Track } from "@/types/track";

type LibraryState = {
  savedTracks: Track[];
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setSavedTracks: (tracks: Track[]) => void;
  addSavedTrack: (track: Track) => void;
  removeSavedTrack: (trackId: string) => void;
  toggleSavedTrack: (track: Track) => void;
  isTrackSaved: (trackId: string) => boolean;
  clearSavedTracks: () => void;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      savedTracks: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setSavedTracks: (tracks) => set({ savedTracks: tracks }),

      addSavedTrack: (track) => {
        const { savedTracks } = get();
        const exists = savedTracks.some((item) => item.id === track.id);

        if (exists) return;

        set({
          savedTracks: [...savedTracks, track],
        });
      },

      removeSavedTrack: (trackId) => {
        const { savedTracks } = get();

        set({
          savedTracks: savedTracks.filter((item) => item.id !== trackId),
        });
      },

      toggleSavedTrack: (track) => {
        const { savedTracks } = get();
        const exists = savedTracks.some((item) => item.id === track.id);

        if (exists) {
          set({
            savedTracks: savedTracks.filter((item) => item.id !== track.id),
          });
        } else {
          set({
            savedTracks: [...savedTracks, track],
          });
        }
      },

      isTrackSaved: (trackId) => {
        return get().savedTracks.some((item) => item.id === trackId);
      },

      clearSavedTracks: () => set({ savedTracks: [] }),
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