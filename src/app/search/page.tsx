"use client";

import { useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import PlaylistPickerModal from "@/components/playlist/PlaylistPickerModal";
import { useMusicLibrary } from "@/hooks/useMusicLibrary";
import { useAddToPlaylist } from "@/hooks/useAddToPlaylist";

export default function SearchPage() {
  const {
    mounted,
    tracks,
    playlists,
    userId,
    loading,
    errorMessage,
    setPlaylists,
  } = useMusicLibrary({ loadPlaylists: true });

  const {
    toastMessage,
    isPlaylistPickerOpen,
    selectedTrackForPlaylist,
    addingTrackToPlaylist,
    closePlaylistPicker,
    addTrackToPlaylist,
    handleAddTrackToPlaylist,
  } = useAddToPlaylist({
    playlists,
    setPlaylists,
    userId,
  });

  const [query, setQuery] = useState("");

  const filteredTracks = useMemo(() => {
    const term = query.toLowerCase().trim();

    if (!term) return tracks;

    return tracks.filter((track) => {
      return (
        track.title.toLowerCase().includes(term) ||
        track.artist.toLowerCase().includes(term)
      );
    });
  }, [query, tracks]);

  if (!mounted) return null;

  return (
    <MainLayout>
      <section>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Explorar
        </p>
        <h2 className="mb-6 text-4xl font-bold text-white">Buscar</h2>

        <input
          type="text"
          placeholder="¿Qué quieres escuchar?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-8 w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-white outline-none placeholder:text-zinc-500"
        />

        {loading ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Cargando canciones...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-300">
            {errorMessage}
          </div>
        ) : filteredTracks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={filteredTracks}
                onAddToPlaylist={handleAddTrackToPlaylist}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            No se encontraron resultados.
          </div>
        )}
      </section>

      <PlaylistPickerModal
        open={isPlaylistPickerOpen}
        track={selectedTrackForPlaylist}
        playlists={playlists}
        loading={addingTrackToPlaylist}
        onClose={closePlaylistPicker}
        onSelectPlaylist={addTrackToPlaylist}
      />

      {toastMessage && (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 shadow-lg backdrop-blur-sm">
          {toastMessage}
        </div>
      )}
    </MainLayout>
  );
}