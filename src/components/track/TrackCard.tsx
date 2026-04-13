"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import type { PlayableItem, Track } from "../../types/track";

type Props = {
  track: Track;
  queue: Track[];
  playlistId?: string;
  index?: number;
  onRemoveFromPlaylist?: (
    trackId: string,
    playlistId: string
  ) => Promise<void> | void;
  onMoveUp?: (trackId: string, playlistId: string) => Promise<void> | void;
  onMoveDown?: (trackId: string, playlistId: string) => Promise<void> | void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onAddToPlaylist?: (track: Track) => Promise<void> | void;
};

function toPlayableTrack(track: Track): PlayableItem {
  return {
    ...track,
    type: "track",
  };
}

export default function TrackCard({
  track,
  queue,
  playlistId,
  index,
  onRemoveFromPlaylist,
  onMoveUp,
  onMoveDown,
  onAddToPlaylist,
  canMoveUp = false,
  canMoveDown = false,
}: Props) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const [mounted, setMounted] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [loadingMoveUp, setLoadingMoveUp] = useState(false);
  const [loadingMoveDown, setLoadingMoveDown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const playableTrack = useMemo(() => toPlayableTrack(track), [track]);
  const playableQueue = useMemo(
    () => queue.map((item) => toPlayableTrack(item)),
    [queue]
  );

  const normalizedPlaylistId =
    typeof playlistId === "string" ? playlistId.trim() : "";

  const isPlaylistContext = normalizedPlaylistId.length > 0;
  const isCurrentTrack = currentTrack?.id === track.id;

  const canAddToPlaylist = !!onAddToPlaylist;
const showAddButton = !isPlaylistContext && canAddToPlaylist;
  const showRemoveButton = isPlaylistContext && !!onRemoveFromPlaylist;
  const showMoveButtons = isPlaylistContext && (!!onMoveUp || !!onMoveDown);

  const playDisabled = !track.audioUrl?.trim();
  const addDisabled = loadingAdd || !canAddToPlaylist;
  const removeDisabled =
    loadingRemove || !normalizedPlaylistId || !onRemoveFromPlaylist;
  const moveUpDisabled =
    loadingMoveUp || !normalizedPlaylistId || !onMoveUp || !canMoveUp;
  const moveDownDisabled =
    loadingMoveDown || !normalizedPlaylistId || !onMoveDown || !canMoveDown;

  const handlePlay = () => {
    if (!track.audioUrl?.trim()) return;

    if (isCurrentTrack) {
      togglePlay();
      return;
    }

    setTrack(playableTrack, playableQueue);
  };

  const handleAdd = async () => {
    if (!onAddToPlaylist) return;

    try {
      setLoadingAdd(true);
      await onAddToPlaylist(track);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemove = async () => {
    if (!normalizedPlaylistId || !onRemoveFromPlaylist) return;

    try {
      setLoadingRemove(true);
      await onRemoveFromPlaylist(track.id, normalizedPlaylistId);
    } catch (error) {
      console.error("Error removing track from playlist:", error);
    } finally {
      setLoadingRemove(false);
    }
  };

  const handleMoveUp = async () => {
    if (!normalizedPlaylistId || !onMoveUp) return;

    try {
      setLoadingMoveUp(true);
      await onMoveUp(track.id, normalizedPlaylistId);
    } catch (error) {
      console.error("Error moving track up:", error);
    } finally {
      setLoadingMoveUp(false);
    }
  };

  const handleMoveDown = async () => {
    if (!normalizedPlaylistId || !onMoveDown) return;

    try {
      setLoadingMoveDown(true);
      await onMoveDown(track.id, normalizedPlaylistId);
    } catch (error) {
      console.error("Error moving track down:", error);
    } finally {
      setLoadingMoveDown(false);
    }
  };

  const showPause = mounted && isCurrentTrack && isPlaying;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {typeof index === "number" && (
          <span className="w-6 shrink-0 text-sm text-zinc-400">
            {index + 1}
          </span>
        )}

        <img
          src={track.coverUrl}
          alt={track.title}
          className="h-14 w-14 shrink-0 rounded object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{track.title}</p>
          <p className="truncate text-sm text-zinc-400">{track.artist}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handlePlay}
          disabled={playDisabled}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          title={showPause ? "Pausar" : "Reproducir"}
        >
          {showPause ? "⏸" : "▶"}
        </button>

        {showAddButton && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={addDisabled}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
            title="Agregar a playlist"
          >
            {loadingAdd ? "..." : "+"}
          </button>
        )}

        {showRemoveButton && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removeDisabled}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            title="Quitar de playlist"
          >
            {loadingRemove ? "..." : "−"}
          </button>
        )}

        {showMoveButtons && (
          <>
            <button
              type="button"
              onClick={handleMoveUp}
              disabled={moveUpDisabled}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-40"
              title="Mover arriba"
            >
              {loadingMoveUp ? "..." : "↑"}
            </button>

            <button
              type="button"
              onClick={handleMoveDown}
              disabled={moveDownDisabled}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-40"
              title="Mover abajo"
            >
              {loadingMoveDown ? "..." : "↓"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}