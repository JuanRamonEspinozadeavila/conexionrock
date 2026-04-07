"use client";

import { getPublicCoverUrl, type AppPlaylist } from "@/lib/music";
import type { Track } from "@/types/track";

type Props = {
  open: boolean;
  track: Track | null;
  playlists: AppPlaylist[];
  loading: boolean;
  onClose: () => void;
  onSelectPlaylist: (track: Track, playlist: AppPlaylist) => Promise<void> | void;
};

export default function PlaylistPickerModal({
  open,
  track,
  playlists,
  loading,
  onClose,
  onSelectPlaylist,
}: Props) {
  if (!open || !track) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Agregar a playlist
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {track.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Elige una playlist para guardar esta canción.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {playlists.map((playlist) => {
            const playlistCover =
              getPublicCoverUrl(playlist.cover_url) ||
              playlist.tracks?.[0]?.coverUrl ||
              "/placeholder-cover.jpg";

            const alreadyExists = (playlist.tracks ?? []).some(
              (item) => item.id === track.id
            );

            return (
              <button
                key={playlist.id}
                type="button"
                disabled={loading || alreadyExists}
                onClick={() => onSelectPlaylist(track, playlist)}
                className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition ${
                  alreadyExists
                    ? "cursor-not-allowed border-white/5 bg-white/[0.03] opacity-50"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <img
                  src={playlistCover}
                  alt={playlist.title}
                  className="h-16 w-16 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {playlist.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {playlist.tracks?.length ?? 0} canciones
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {alreadyExists
                      ? "Esta canción ya está en esta playlist"
                      : "Haz clic para agregar"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs text-zinc-500">
            {loading
              ? "Agregando canción..."
              : "Selecciona una playlist disponible."}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}