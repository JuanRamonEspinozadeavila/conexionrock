"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

type PodcastOption = {
  id: string;
  title: string;
};

export default function UploadPodcastPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState("");

  const [mode, setMode] = useState<"podcast" | "episode">("podcast");

  const [podcasts, setPodcasts] = useState<PodcastOption[]>([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(false);

  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastAuthor, setPodcastAuthor] = useState("");
  const [podcastDescription, setPodcastDescription] = useState("");
  const [podcastCoverFile, setPodcastCoverFile] = useState<File | null>(null);

  const [selectedPodcastId, setSelectedPodcastId] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDescription, setEpisodeDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeAudioFile, setEpisodeAudioFile] = useState<File | null>(null);
  const [episodeCoverFile, setEpisodeCoverFile] = useState<File | null>(null);
  const [episodeDuration, setEpisodeDuration] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setAuthChecked(true);
        setMessage("Error obteniendo sesión.");
        return;
      }

      const user = session?.user;

      if (!user) {
        setAuthChecked(true);
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setAuthChecked(true);
    };

    void checkAuth();
  }, [mounted, router]);

  const loadUserPodcasts = async () => {
    setLoadingPodcasts(true);

    try {
      if (!userId) {
        throw new Error("Debes iniciar sesión.");
      }

      const { data, error } = await supabase
        .from("podcasts")
        .select("id, title")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPodcasts((data ?? []) as PodcastOption[]);
    } catch (error: any) {
      setMessage(error.message || "No se pudieron cargar los podcasts.");
    } finally {
      setLoadingPodcasts(false);
    }
  };

  const handleChangeMode = async (nextMode: "podcast" | "episode") => {
    setMode(nextMode);
    setMessage("");

    if (nextMode === "episode") {
      await loadUserPodcasts();
    }
  };

  const handleCreatePodcast = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!userId) {
        throw new Error("Debes iniciar sesión para crear un podcast.");
      }

      let coverPath: string | null = null;

      if (podcastCoverFile) {
        const cleanCoverName = sanitizeFileName(podcastCoverFile.name);
        const coverFileName = `${userId}-${Date.now()}-${cleanCoverName}`;

        const { error: coverError } = await supabase.storage
          .from("podcast-covers")
          .upload(coverFileName, podcastCoverFile);

        if (coverError) throw coverError;

        coverPath = coverFileName;
      }

      const { error: insertError } = await supabase.from("podcasts").insert({
        user_id: userId,
        title: podcastTitle,
        author: podcastAuthor,
        description: podcastDescription || null,
        cover_url: coverPath,
      });

      if (insertError) throw insertError;

      setMessage("Podcast creado correctamente.");
      setPodcastTitle("");
      setPodcastAuthor("");
      setPodcastDescription("");
      setPodcastCoverFile(null);

      if (mode === "episode") {
        await loadUserPodcasts();
      }
    } catch (error: any) {
      setMessage(error.message || "Ocurrió un error al crear el podcast.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEpisode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!userId) {
        throw new Error("Debes iniciar sesión para subir episodios.");
      }

      if (!selectedPodcastId) {
        throw new Error("Debes seleccionar un podcast.");
      }

      if (!episodeAudioFile) {
        throw new Error("Debes seleccionar un archivo de audio.");
      }

      const cleanAudioName = sanitizeFileName(episodeAudioFile.name);
      const audioFileName = `${userId}-${Date.now()}-${cleanAudioName}`;

      const { error: audioError } = await supabase.storage
        .from("podcast-audio")
        .upload(audioFileName, episodeAudioFile);

      if (audioError) throw audioError;

      let coverPath: string | null = null;

      if (episodeCoverFile) {
        const cleanCoverName = sanitizeFileName(episodeCoverFile.name);
        const coverFileName = `${userId}-${Date.now()}-${cleanCoverName}`;

        const { error: coverError } = await supabase.storage
          .from("podcast-covers")
          .upload(coverFileName, episodeCoverFile);

        if (coverError) throw coverError;

        coverPath = coverFileName;
      }

      const parsedEpisodeNumber = episodeNumber.trim()
        ? Number(episodeNumber)
        : null;

      const parsedDuration = episodeDuration.trim()
        ? Number(episodeDuration)
        : 0;

      const { error: insertError } = await supabase
        .from("podcast_episodes")
        .insert({
          podcast_id: selectedPodcastId,
          title: episodeTitle,
          description: episodeDescription || null,
          audio_url: audioFileName,
          cover_url: coverPath,
          duration: Number.isFinite(parsedDuration) ? parsedDuration : 0,
          episode_number: Number.isFinite(parsedEpisodeNumber)
            ? parsedEpisodeNumber
            : null,
        });

      if (insertError) throw insertError;

      setMessage("Episodio subido correctamente.");
      setEpisodeTitle("");
      setEpisodeDescription("");
      setEpisodeNumber("");
      setEpisodeAudioFile(null);
      setEpisodeCoverFile(null);
      setEpisodeDuration("");
    } catch (error: any) {
      setMessage(error.message || "Ocurrió un error al subir el episodio.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !authChecked) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-6 text-zinc-300 shadow-2xl">
          Cargando acceso...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Podcasts
        </p>

        <h1 className="mb-6 text-3xl font-bold">Subir podcast</h1>

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => handleChangeMode("podcast")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "podcast"
                ? "bg-white text-black"
                : "border border-white/15 text-white hover:bg-white/10"
            }`}
          >
            Nuevo podcast
          </button>

          <button
            type="button"
            onClick={() => handleChangeMode("episode")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "episode"
                ? "bg-white text-black"
                : "border border-white/15 text-white hover:bg-white/10"
            }`}
          >
            Nuevo episodio
          </button>
        </div>

        {mode === "podcast" ? (
          <form onSubmit={handleCreatePodcast} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Título</label>
              <input
                type="text"
                value={podcastTitle}
                onChange={(e) => setPodcastTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="Nombre del podcast"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">Autor</label>
              <input
                type="text"
                value={podcastAuthor}
                onChange={(e) => setPodcastAuthor(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="Nombre del autor"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Descripción
              </label>
              <textarea
                value={podcastDescription}
                onChange={(e) => setPodcastDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="Descripción del podcast"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Portada
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPodcastCoverFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-zinc-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear podcast"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateEpisode} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Podcast
              </label>
              <select
                value={selectedPodcastId}
                onChange={(e) => setSelectedPodcastId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                required
              >
                <option value="">
                  {loadingPodcasts
                    ? "Cargando podcasts..."
                    : "Selecciona un podcast"}
                </option>
                {podcasts.map((podcast) => (
                  <option key={podcast.id} value={podcast.id}>
                    {podcast.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Título del episodio
              </label>
              <input
                type="text"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="Nombre del episodio"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Descripción
              </label>
              <textarea
                value={episodeDescription}
                onChange={(e) => setEpisodeDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                placeholder="Descripción del episodio"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Número de episodio
                </label>
                <input
                  type="number"
                  min="1"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Duración en segundos
                </label>
                <input
                  type="number"
                  min="0"
                  value={episodeDuration}
                  onChange={(e) => setEpisodeDuration(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                  placeholder="3600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Archivo de audio
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setEpisodeAudioFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-zinc-300"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Portada del episodio (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEpisodeCoverFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-zinc-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading || loadingPodcasts}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Subiendo..." : "Subir episodio"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-black/30 p-3 text-sm text-zinc-300">
            {message}
          </p>
        )}
      </div>
    </MainLayout>
  );
}