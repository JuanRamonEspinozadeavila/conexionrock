"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import PlaylistPickerModal from "@/components/playlist/PlaylistPickerModal";
import UserInfo from "@/components/auth/UserInfo";
import { useMusicLibrary } from "@/hooks/useMusicLibrary";
import { useAddToPlaylist } from "@/hooks/useAddToPlaylist";
import { usePlayerStore } from "@/stores/playerStore";

function getGreetingByHour(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 0 && hour < 5) return "Noche de música";
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
export default function HomeContentPage() {
  const {
    mounted,
    tracks,
    playlists,
    userId,
    loading,
    errorMessage,
    setPlaylists,
  } = useMusicLibrary({ loadPlaylists: false });

  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const [greeting, setGreeting] = useState(getGreetingByHour());

  const isLoggedIn = !!userId;
  const isGuest = !loading && !userId;

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

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreetingByHour());
    };

    updateGreeting();

    const interval = setInterval(updateGreeting, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <MainLayout>
      {isLoggedIn && <UserInfo />}

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 md:p-12">
        {currentTrack?.coverUrl && (
          <>
            <div
              className="pointer-events-none absolute inset-[-12%] opacity-80"
              style={{
                backgroundImage: `url(${currentTrack.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(10px)",
                transform: "scale(1.12)",
                transition: "all 1600ms ease-out",
              }}
            />

            <div className="pointer-events-none absolute inset-0 bg-black/38 transition-all duration-[1600ms] ease-out" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/58 via-black/28 to-black/42 transition-all duration-[1600ms] ease-out" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/30 transition-all duration-[1600ms] ease-out" />
          </>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/52 via-black/18 to-black/36" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/6 to-black/28" />

        <div className="relative z-10 max-w-3xl">
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

          {currentTrack && (
            <p className="mt-4 text-sm font-medium text-zinc-300">
              Sonando ahora:{" "}
              <span className="text-white">{currentTrack.title}</span>
              {" · "}
              <span className="text-zinc-400">{currentTrack.artist}</span>
            </p>
          )}

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-xl">
            {isGuest
              ? "Explora canciones y conoce la app en modo invitado. Inicia sesión para guardar favoritos y crear playlists."
              : "Explora playlists, guarda tus temas preferidos y disfruta una experiencia de música moderna con una interfaz elegante y dinámica."}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            {isGuest ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/10 bg-zinc-900 px-8 py-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Iniciar sesión
                </Link>

                <a
                  href="#tracks"
                  className="rounded-full border border-white/10 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Explorar canciones
                </a>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      <section id="tracks" className="mb-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Descubrir
        </p>
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
          {greeting}
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
                onAddToPlaylist={
                  isLoggedIn ? handleAddTrackToPlaylist : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {isLoggedIn && (
        <PlaylistPickerModal
          open={isPlaylistPickerOpen}
          track={selectedTrackForPlaylist}
          playlists={playlists}
          loading={addingTrackToPlaylist}
          onClose={closePlaylistPicker}
          onSelectPlaylist={addTrackToPlaylist}
        />
      )}

      {toastMessage && (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 shadow-lg backdrop-blur-sm">
          {toastMessage}
        </div>
      )}
    </MainLayout>
  );
}