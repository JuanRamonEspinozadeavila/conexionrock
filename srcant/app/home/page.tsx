import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import UserInfo from "@/components/auth/UserInfo";
import { playlists } from "@/data/playlists";
import { supabase } from "@/lib/supabase";
import type { Track } from "@/types/track";

export default async function HomeContentPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tracks, error } = await supabase
    .from("tracks")
    .select("*")
    .order("created_at", { ascending: false });

  const mappedTracks: Track[] =
    tracks?.map((track) => {
      const { data: audioData } = supabase.storage
        .from("track-audio")
        .getPublicUrl(track.audio_url);

      const coverPublicUrl = track.cover_url
        ? supabase.storage
            .from("track-covers")
            .getPublicUrl(track.cover_url).data.publicUrl
        : "/placeholder-cover.jpg";

      return {
        id: String(track.id),
        title: String(track.title),
        artist: String(track.artist),
        coverUrl: coverPublicUrl,
        audioUrl: audioData.publicUrl,
        duration: Number(track.duration ?? 0),
      };
    }) || [];

  return (
    <MainLayout>
      <UserInfo />

      <section className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] md:p-8">
          <div className="min-w-0 flex flex-col justify-end">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">
              Bienvenido
            </p>

            <h1 className="mb-4 max-w-2xl break-words text-4xl font-bold leading-tight text-white md:text-6xl">
              Descubre tu próxima canción favorita
            </h1>

            <p className="mb-6 max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
              Explora playlists, guarda tus temas preferidos y disfruta una
              experiencia de música moderna con una interfaz elegante y dinámica.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#tracks"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Explorar canciones
              </a>

              <a
                href="#playlists"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver playlists
              </a>
            </div>
          </div>

          <div className="min-w-0 grid grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-2xl">
              <img
                src={playlists[0]?.coverUrl || "/placeholder-cover.jpg"}
                alt={playlists[0]?.title || "Playlist"}
                className="h-full min-h-[180px] w-full object-cover"
              />
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl">
              <img
                src={
                  mappedTracks.length > 0
                    ? mappedTracks[0].coverUrl
                    : playlists[1]?.coverUrl || "/placeholder-cover.jpg"
                }
                alt={mappedTracks.length > 0 ? mappedTracks[0].title : "Track"}
                className="h-full min-h-[180px] w-full object-cover"
              />
            </div>
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

        {error ? (
          <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
            Error cargando canciones: {error.message}
          </div>
        ) : mappedTracks.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Todavía no hay canciones subidas.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mappedTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={mappedTracks}
                userId={user?.id ?? ""}
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
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>
    </MainLayout>
  );
}