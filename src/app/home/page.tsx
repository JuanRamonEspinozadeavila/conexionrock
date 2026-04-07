"use client";

import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import PlaylistPickerModal from "@/components/playlist/PlaylistPickerModal";
import UserInfo from "@/components/auth/UserInfo";
import { playlists as featuredPlaylists } from "@/data/playlists";
import { useMusicLibrary } from "@/hooks/useMusicLibrary";
import { useAddToPlaylist } from "@/hooks/useAddToPlaylist";

export default function HomeContentPage() {
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

  if (!mounted) return null;

  return (
    <MainLayout>
      <UserInfo />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 md:p-12">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">
            Bienvenido
          </p>

          <h1 className="text-5xl font-bold leading-tight text-white md:text-7xl">
            Descubre tu
            <br />
            próxima canción
            <br />
            favorita
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-xl">
            Explora playlists, guarda tus temas preferidos y disfruta una
            experiencia de música moderna con una interfaz elegante y dinámica.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/library?tab=playlists"
              className="rounded-full border border-white/10 bg-zinc-900 px-8 py-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              Crear playlist
            </Link>

            <Link
              href="/library?tab=playlists"
              className="rounded-full border border-white/10 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Ver playlists
            </Link>
          </div>
        </div>
      </section>

      <section id="tracks" className="mb-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Descubrir
        </p>
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
          Buenas noches
        </h2>

        {loading ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Cargando canciones...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 text-zinc-300">
            {errorMessage}
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Todavía no hay canciones subidas.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={tracks}
                onAddToPlaylist={handleAddTrackToPlaylist}
              />
            ))}
          </div>
        )}
      </section>

      <section id="playlists">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Curado para ti
        </p>
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
          Playlists destacadas
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
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