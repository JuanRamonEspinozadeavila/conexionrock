"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import UploadButtons from "@/components/common/UploadButtons";
import { supabase } from "@/lib/supabase";
import type { Track } from "@/types/track";

type DbTrack = {
  id: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  audio_url?: string | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
  user_id?: string | null;
};

type FavoriteRow = {
  song_id: string;
};

type PlaylistTrackRelation = {
  id: string;
  position: number;
  track_id: string;
  tracks: DbTrack | DbTrack[] | null;
};

type Playlist = {
  id: string;
  title: string;
  created_at?: string;
  cover_url?: string | null;
  tracks?: Track[];
};

function getPublicCoverUrl(fileName?: string | null) {
  if (!fileName) return null;
  return supabase.storage.from("track-covers").getPublicUrl(fileName).data
    .publicUrl;
}

function mapTrackToPlayerFormat(track: DbTrack): Track {
  const coverFileName = track.cover_url ?? track.coverUrl ?? "";
  const audioFileName = track.audio_url ?? track.audioUrl ?? "";

  const coverUrl = coverFileName
    ? supabase.storage.from("track-covers").getPublicUrl(coverFileName).data
        .publicUrl
    : "/placeholder-cover.jpg";

  const audioUrl = audioFileName
    ? supabase.storage.from("track-audio").getPublicUrl(audioFileName).data
        .publicUrl
    : "";

  return {
    id: String(track.id),
    title: String(track.title),
    artist: String(track.artist),
    coverUrl,
    audioUrl,
    duration: Number(track.duration ?? 0),
  };
}

function normalizeRelatedTrack(
  value: DbTrack | DbTrack[] | null | undefined
): DbTrack | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default function LibraryPage() {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Cargando tu biblioteca...");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [activeTab, setActiveTab] = useState<"uploads" | "liked" | "playlists">(
    "uploads"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "liked") {
      setActiveTab("liked");
    } else if (tab === "playlists") {
      setActiveTab("playlists");
    } else {
      setActiveTab("uploads");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!mounted) return;

    const fetchLibrary = async () => {
      setLoading(true);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError.message);
        setMessage("Error obteniendo sesión");
        setLoading(false);
        return;
      }

      const user = sessionData.session?.user;

      if (!user) {
        setMessage("No hay sesión activa");
        setLoading(false);
        return;
      }

      const { data: uploadedData, error: uploadedError } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (uploadedError) {
        console.error(
          "Error obteniendo canciones subidas:",
          uploadedError.message
        );
        setMessage("Error obteniendo canciones subidas");
        setLoading(false);
        return;
      }

      const mappedUploads = ((uploadedData ?? []) as DbTrack[]).map(
        mapTrackToPlayerFormat
      );

      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select("song_id")
        .eq("user_id", user.id);

      if (favoritesError) {
        console.error("Error obteniendo favoritos:", favoritesError.message);
        setMessage("Error obteniendo favoritos");
        setLoading(false);
        return;
      }

      const favoriteIds = ((favoritesData ?? []) as FavoriteRow[]).map(
        (fav) => fav.song_id
      );

      let mappedLiked: Track[] = [];

      if (favoriteIds.length > 0) {
        const { data: likedData, error: likedError } = await supabase
          .from("tracks")
          .select("*")
          .in("id", favoriteIds)
          .order("created_at", { ascending: false });

        if (likedError) {
          console.error(
            "Error obteniendo tracks favoritos:",
            likedError.message
          );
          setMessage("Error obteniendo tracks favoritos");
          setLoading(false);
          return;
        }

        mappedLiked = ((likedData ?? []) as DbTrack[]).map(
          mapTrackToPlayerFormat
        );
      }

      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_tracks (
            id,
            position,
            track_id,
            tracks (
              id,
              title,
              artist,
              cover_url,
              audio_url,
              duration
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (playlistsError) {
        console.error("Error obteniendo playlists:", playlistsError.message);
        setMessage("Error obteniendo playlists");
        setLoading(false);
        return;
      }

      const playlistsFormatted: Playlist[] = ((playlistsData ?? []) as Array<
        Playlist & {
          cover_url?: string | null;
          playlist_tracks?: PlaylistTrackRelation[];
        }
      >).map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        created_at: playlist.created_at,
        cover_url: playlist.cover_url ?? null,
        tracks: (playlist.playlist_tracks ?? [])
          .sort((a, b) => a.position - b.position)
          .map((item) => normalizeRelatedTrack(item.tracks))
          .filter(
            (track): track is DbTrack =>
              Boolean(track?.id && track?.title && track?.artist)
          )
          .map(mapTrackToPlayerFormat),
      }));

      setTracks(mappedUploads);
      setLikedTracks(mappedLiked);
      setPlaylists(playlistsFormatted);
      setMessage("");
      setLoading(false);
    };

    fetchLibrary();
  }, [mounted]);

  const handleCreatePlaylist = async () => {
    const title = newPlaylistName.trim();

    if (!title || creatingPlaylist) return;

    setCreatingPlaylist(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No hay usuario autenticado", {
          message: userError?.message,
          user,
        });
        setMessage("No hay usuario autenticado");
        return;
      }

      const payload = {
        user_id: user.id,
        title,
        cover_url: null,
      };

      const { data, error } = await supabase
        .from("playlists")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Error creando playlist", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload,
        });
        setMessage(`Error creando playlist: ${error.message}`);
        return;
      }

      setPlaylists((prev) => [
        {
          ...(data as Playlist),
          tracks: [],
        },
        ...prev,
      ]);

      setNewPlaylistName("");
      setMessage("");
    } catch (error) {
      console.error("Error inesperado creando playlist", {
        raw: error,
        message: error instanceof Error ? error.message : String(error),
      });
      setMessage("Error inesperado creando playlist");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleAddTrackToPlaylist = async (track: Track) => {
    try {
      if (playlists.length === 0) {
        setMessage("Primero crea una playlist.");
        return;
      }

      let selectedPlaylist: Playlist | null = null;

      if (playlists.length === 1) {
        selectedPlaylist = playlists[0];
      } else {
        const options = playlists
          .map((playlist, index) => `${index + 1}. ${playlist.title}`)
          .join("\n");

        const selectedValue = window.prompt(
          `Elige una playlist escribiendo el número:\n\n${options}`
        );

        if (!selectedValue) return;

        const selectedIndex = Number(selectedValue) - 1;

        if (
          Number.isNaN(selectedIndex) ||
          selectedIndex < 0 ||
          selectedIndex >= playlists.length
        ) {
          setMessage("Selección inválida.");
          return;
        }

        selectedPlaylist = playlists[selectedIndex];
      }

      if (!selectedPlaylist) return;

      const alreadyExists = (selectedPlaylist.tracks ?? []).some(
        (item) => item.id === track.id
      );

      if (alreadyExists) {
        setMessage(`"${track.title}" ya está en "${selectedPlaylist.title}".`);
        return;
      }

      const { data: lastPositionRow, error: lastPositionError } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", selectedPlaylist.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPositionError) {
        console.error("Error obteniendo última posición:", lastPositionError);
        setMessage("No se pudo calcular la posición en la playlist.");
        return;
      }

      const nextPosition = Number(lastPositionRow?.position ?? -1) + 1;

      const { error: insertError } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: selectedPlaylist.id,
          track_id: track.id,
          position: nextPosition,
        });

      if (insertError) {
        console.error("Error agregando track a playlist:", insertError);
        setMessage(`Error agregando a playlist: ${insertError.message}`);
        return;
      }

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === selectedPlaylist!.id
            ? {
                ...playlist,
                tracks: [...(playlist.tracks ?? []), track],
              }
            : playlist
        )
      );

      window.dispatchEvent(
        new CustomEvent("playlist:updated", {
          detail: { playlistId: selectedPlaylist.id },
        })
      );

      setMessage(`"${track.title}" agregada a "${selectedPlaylist.title}".`);
    } catch (error) {
      console.error("Error inesperado agregando track a playlist:", error);
      setMessage("Error inesperado agregando track a playlist.");
    }
  };

  if (!mounted) return null;

  const currentTracks =
    activeTab === "uploads"
      ? tracks
      : activeTab === "liked"
        ? likedTracks
        : [];

  const emptyText =
    activeTab === "uploads"
      ? "No subiste canciones todavía."
      : activeTab === "liked"
        ? "No tienes favoritos todavía."
        : "Todavía no tienes playlists.";

  return (
    <MainLayout>
      <section className="mb-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Tu música
        </p>

        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Tu biblioteca
        </h1>

        <div className="mb-6">
          <UploadButtons />
        </div>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setActiveTab("uploads")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "uploads"
                ? "bg-white text-black"
                : "border border-white/15 text-white hover:bg-white/10"
            }`}
          >
            Subidas
          </button>

          <button
            onClick={() => setActiveTab("liked")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "liked"
                ? "bg-white text-black"
                : "border border-white/15 text-white hover:bg-white/10"
            }`}
          >
            Favoritos
          </button>

          <button
            onClick={() => setActiveTab("playlists")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "playlists"
                ? "bg-white text-black"
                : "border border-white/15 text-white hover:bg-white/10"
            }`}
          >
            Playlists
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Cargando tu biblioteca...
          </div>
        ) : message ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            {message}
          </div>
        ) : activeTab === "playlists" ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-900 p-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Nombre de la playlist"
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                />

                <button
                  onClick={handleCreatePlaylist}
                  disabled={creatingPlaylist || !newPlaylistName.trim()}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {creatingPlaylist ? "Creando..." : "Crear playlist"}
                </button>
              </div>
            </div>

            {playlists.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
                Todavía no tienes playlists.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {playlists.map((playlist) => {
                  const playlistCover =
                    getPublicCoverUrl(playlist.cover_url) ||
                    playlist.tracks?.[0]?.coverUrl ||
                    "/placeholder-cover.jpg";

                  return (
                    <Link
                      key={playlist.id}
                      href={`/library/playlists/${playlist.id}`}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white transition hover:bg-white/10"
                    >
                      <img
                        src={playlistCover}
                        alt={playlist.title}
                        className="h-36 w-full rounded-xl object-cover"
                      />

                      <p className="mt-4 text-lg font-semibold">
                        {playlist.title}
                      </p>
                      <p className="mt-2 text-sm text-zinc-400">
                        {playlist.tracks?.length ?? 0} canciones
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : currentTracks.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            {emptyText}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={currentTracks}
                onAddToPlaylist={handleAddTrackToPlaylist}
              />
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}