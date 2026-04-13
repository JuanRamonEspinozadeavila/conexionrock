"use client";

import { useState } from "react";

export type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
};

type Props = {
  track: Track;
  queue: Track[];
  userId?: string;
  playlistId?: string;
  index?: number;
  onRemoveFromPlaylist?: (
    trackId: string,
    playlistId: string
  ) => Promise<void> | void;
  onMoveUp?: (trackId: string, playlistId: string) => Promise<void> | void;
  onMoveDown?: (trackId: string, playlistId: string) => Promise<void> | void;
  onAddToPlaylist?: (track: Track) => Promise<void> | void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export default function TrackCard({
  track,
  queue,
  userId,
  playlistId,
  index,
  onRemoveFromPlaylist,
  onMoveUp,
  onMoveDown,
  onAddToPlaylist,
  canMoveUp,
  canMoveDown,
}: Props) {
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [loadingMoveUp, setLoadingMoveUp] = useState(false);
  const [loadingMoveDown, setLoadingMoveDown] = useState(false);

  const isPlaylistContext = !!playlistId;
  const canAddToPlaylist = !!onAddToPlaylist;
const showAddButton = !isPlaylistContext && canAddToPlaylist;
  const showRemoveButton = isPlaylistContext && !!onRemoveFromPlaylist;
  const showMoveButtons = isPlaylistContext && !!onMoveUp && !!onMoveDown;

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
    if (!playlistId || !onRemoveFromPlaylist) return;
    try {
      setLoadingRemove(true);
      await onRemoveFromPlaylist(track.id, playlistId);
    } catch (error) {
      console.error("Error removing track from playlist:", error);
    } finally {
      setLoadingRemove(false);
    }
  };

  const handleMoveUp = async () => {
    if (!playlistId || !onMoveUp) return;
    try {
      setLoadingMoveUp(true);
      await onMoveUp(track.id, playlistId);
    } catch (error) {
      console.error("Error moving track up:", error);
    } finally {
      setLoadingMoveUp(false);
    }
  };

  const handleMoveDown = async () => {
    if (!playlistId || !onMoveDown) return;
    try {
      setLoadingMoveDown(true);
      await onMoveDown(track.id, playlistId);
    } catch (error) {
      console.error("Error moving track down:", error);
    } finally {
      setLoadingMoveDown(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds && seconds !== 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex min-w-0 items-center gap-3">
        {typeof index === "number" && (
          <span className="w-6 text-sm text-zinc-400">{index + 1}</span>
        )}

        <img
          src={track.coverUrl}
          alt={track.title}
          className="h-14 w-14 rounded object-cover"
        />

        <div className="min-w-0">
          <p className="truncate font-medium text-white">{track.title}</p>
          <p className="truncate text-sm text-zinc-400">{track.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-zinc-400 sm:block">
          {formatDuration(track.duration)}
        </span>

        {showAddButton && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={loadingAdd}
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
            disabled={loadingRemove}
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
              disabled={loadingMoveUp || !canMoveUp}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-40"
              title="Mover arriba"
            >
              ↑
            </button>

            <button
              type="button"
              onClick={handleMoveDown}
              disabled={loadingMoveDown || !canMoveDown}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-40"
              title="Mover abajo"
            >
              ↓
            </button>
          </>
        )}
      </div>
    </div>
  );
}