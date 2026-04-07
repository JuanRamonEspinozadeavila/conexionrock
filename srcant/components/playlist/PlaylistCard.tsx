import Link from "next/link";
import { Playlist } from "@/types/playlist";

type PlaylistCardProps = {
  playlist: Playlist;
};

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 p-4 transition duration-200 hover:-translate-y-1 hover:bg-zinc-800"
    >
      <div className="mb-4 overflow-hidden rounded-xl">
        <img
          src={playlist.coverUrl}
          alt={playlist.title}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <p className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
        Playlist
      </p>

      <h3 className="truncate text-base font-semibold text-white">
        {playlist.title}
      </h3>

      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
        {playlist.description}
      </p>
    </Link>
  );
}