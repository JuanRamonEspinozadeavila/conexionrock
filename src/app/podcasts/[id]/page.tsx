"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { usePlayerStore } from "@/stores/playerStore";
import type { PlayableItem, Podcast, PodcastEpisode } from "@/types/track";

type DbPodcast = {
  id: string;
  title: string;
  author: string;
  cover_url?: string | null;
  description?: string | null;
};

type DbPodcastEpisode = {
  id: string;
  podcast_id: string;
  title: string;
  description?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
  duration?: number | null;
  episode_number?: number | null;
};

function getPodcastCoverUrl(fileName?: string | null) {
  if (!fileName) return "/placeholder-cover.jpg";

  return supabase.storage.from("podcast-covers").getPublicUrl(fileName).data
    .publicUrl;
}

function getPodcastAudioUrl(fileName?: string | null) {
  if (!fileName) return "";

  return supabase.storage.from("podcast-audio").getPublicUrl(fileName).data
    .publicUrl;
}

function mapPodcast(row: DbPodcast): Podcast {
  return {
    id: String(row.id),
    title: String(row.title),
    author: String(row.author),
    coverUrl: getPodcastCoverUrl(row.cover_url),
    description: row.description ?? null,
  };
}

function mapEpisode(
  row: DbPodcastEpisode,
  podcast: Podcast
): PodcastEpisode {
  const ownCover = getPodcastCoverUrl(row.cover_url);

  return {
    id: String(row.id),
    podcastId: String(row.podcast_id),
    title: String(row.title),
    description: row.description ?? null,
    audioUrl: getPodcastAudioUrl(row.audio_url),
    coverUrl: row.cover_url ? ownCover : podcast.coverUrl,
    duration: Number(row.duration ?? 0),
    episodeNumber: row.episode_number ?? null,
    podcastTitle: podcast.title,
    author: podcast.author,
  };
}

function toPlayableEpisode(episode: PodcastEpisode): PlayableItem {
  return {
    ...episode,
    type: "podcast_episode",
  };
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function PodcastDetailPage() {
  const params = useParams();
  const podcastId = typeof params?.id === "string" ? params.id : "";

  const [mounted, setMounted] = useState(false);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Cargando podcast...");

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !podcastId) return;

    const fetchPodcastDetail = async () => {
      setLoading(true);

      const { data: podcastData, error: podcastError } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();

      if (podcastError || !podcastData) {
        console.error("Error obteniendo podcast:", podcastError?.message);
        setMessage("No se pudo cargar el podcast.");
        setLoading(false);
        return;
      }

      const mappedPodcast = mapPodcast(podcastData as DbPodcast);

      const { data: episodesData, error: episodesError } = await supabase
        .from("podcast_episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("episode_number", { ascending: true })
        .order("created_at", { ascending: true });

      if (episodesError) {
        console.error("Error obteniendo episodios:", episodesError.message);
        setMessage("No se pudieron cargar los episodios.");
        setLoading(false);
        return;
      }

      const mappedEpisodes = ((episodesData ?? []) as DbPodcastEpisode[]).map(
        (episode) => mapEpisode(episode, mappedPodcast)
      );

      setPodcast(mappedPodcast);
      setEpisodes(mappedEpisodes);
      setMessage(mappedEpisodes.length === 0 ? "Este podcast no tiene episodios todavía." : "");
      setLoading(false);
    };

    fetchPodcastDetail();
  }, [mounted, podcastId]);

  const playableQueue = useMemo(
    () => episodes.map((episode) => toPlayableEpisode(episode)),
    [episodes]
  );

  const handlePlayEpisode = (episode: PodcastEpisode) => {
    if (!episode.audioUrl?.trim()) return;

    const isCurrentEpisode =
      currentTrack?.type === "podcast_episode" && currentTrack.id === episode.id;

    if (isCurrentEpisode) {
      togglePlay();
      return;
    }

    setTrack(toPlayableEpisode(episode), playableQueue);
  };

  if (!mounted) return null;

  return (
    <MainLayout>
      <section className="mb-12">
        {loading ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Cargando podcast...
          </div>
        ) : !podcast ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            {message}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-6 rounded-3xl bg-zinc-900/70 p-6 md:flex-row md:items-end">
              <img
                src={podcast.coverUrl || "/placeholder-cover.jpg"}
                alt={podcast.title}
                className="h-48 w-48 rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Podcast
                </p>

                <h1 className="text-3xl font-bold text-white md:text-5xl">
                  {podcast.title}
                </h1>

                <p className="mt-3 text-base text-zinc-300">
                  {podcast.author}
                </p>

                {podcast.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
                    {podcast.description}
                  </p>
                ) : null}

                <p className="mt-4 text-sm text-zinc-500">
                  {episodes.length} episodio{episodes.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {message && episodes.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
                {message}
              </div>
            ) : (
              <div className="space-y-3">
                {episodes.map((episode, index) => {
                  const isCurrentEpisode =
                    currentTrack?.type === "podcast_episode" &&
                    currentTrack.id === episode.id;

                  const showPause = isCurrentEpisode && isPlaying;
                  const playDisabled = !episode.audioUrl?.trim();

                  return (
                    <div
                      key={episode.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <span className="w-8 shrink-0 text-sm text-zinc-500">
                          {episode.episodeNumber ?? index + 1}
                        </span>

                        <img
                          src={episode.coverUrl || "/placeholder-cover.jpg"}
                          alt={episode.title}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">
                            {episode.title}
                          </p>

                          <p className="truncate text-sm text-zinc-400">
                            {episode.author || episode.podcastTitle || "Podcast"}
                          </p>

                          {episode.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                              {episode.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-sm text-zinc-500 md:inline">
                          {formatDuration(episode.duration)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handlePlayEpisode(episode)}
                          disabled={playDisabled}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {showPause ? "⏸" : "▶"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </MainLayout>
  );
}