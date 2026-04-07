"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import type { Podcast } from "@/types/track";

type DbPodcast = {
  id: string;
  title: string;
  author: string;
  cover_url?: string | null;
  description?: string | null;
};

function mapPodcast(row: DbPodcast): Podcast {
  const coverUrl = row.cover_url
    ? supabase.storage.from("podcast-covers").getPublicUrl(row.cover_url).data
        .publicUrl
    : "/placeholder-cover.jpg";

  return {
    id: String(row.id),
    title: String(row.title),
    author: String(row.author),
    coverUrl,
    description: row.description ?? null,
  };
}

export default function PodcastsPage() {
  const [mounted, setMounted] = useState(false);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Cargando podcasts...");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchPodcasts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error obteniendo podcasts:", error.message);
        setMessage("Error obteniendo podcasts");
        setLoading(false);
        return;
      }

      const mapped = ((data ?? []) as DbPodcast[]).map(mapPodcast);

      setPodcasts(mapped);
      setMessage(mapped.length === 0 ? "Todavía no hay podcasts." : "");
      setLoading(false);
    };

    fetchPodcasts();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <MainLayout>
      <section className="mb-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Podcasts
        </p>

        <h1 className="mb-6 text-3xl font-bold text-white md:text-4xl">
          Explora podcasts
        </h1>

        {loading ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Cargando podcasts...
          </div>
        ) : message ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            {message}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {podcasts.map((podcast) => (
              <Link
                key={podcast.id}
                href={`/podcasts/${podcast.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white transition hover:bg-white/10"
              >
                <img
                  src={podcast.coverUrl || "/placeholder-cover.jpg"}
                  alt={podcast.title}
                  className="h-48 w-full rounded-xl object-cover"
                />

                <p className="mt-4 text-lg font-semibold">{podcast.title}</p>
                <p className="mt-2 text-sm text-zinc-400">{podcast.author}</p>

                {podcast.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-zinc-500">
                    {podcast.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}