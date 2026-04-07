import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import { playlists } from "@/data/playlists";

type PlaylistPageProps = {
  params: {
    id: string;
  };
};

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const playlist = playlists.find((item) => item.id === params.id);

  if (!playlist) {
    return (
      <MainLayout>
        <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
          Playlist no encontrada.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="grid gap-6 p-6 md:grid-cols-[260px_1fr] md:items-end md:p-8">
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="h-[260px] w-full object-cover md:w-[260px]"
            />
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-400">
              Playlist
            </p>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-6xl">
              {playlist.title}
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              {playlist.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="rounded-full bg-white/10 px-4 py-2">
                {playlist.tracks.length} canciones
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2">
                Selección curada
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Contenido
        </p>
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
          Canciones de la playlist
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {playlist.tracks.map((track) => (
            <TrackCard key={track.id} track={track} queue={playlist.tracks} />
          ))}
        </div>
      </section>
    </MainLayout>
  );
}