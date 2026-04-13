"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useCallback,
  type ChangeEvent,
} from "react";
import MainLayout from "@/components/layout/MainLayout";
import TrackCard from "@/components/track/TrackCard";
import { supabase } from "@/lib/supabase";
import { usePlayerStore } from "@/stores/playerStore";
import type { Track, PlayableItem } from "@/types/track";
import { formatTime } from "@/lib/formatTime";

type DbTrack = {
  id: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  audio_url?: string | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
};

type PlaylistTrackRelation = {
  id: string;
  position: number | null;
  track_id: string;
  tracks: DbTrack | DbTrack[] | null;
};

type PlaylistRow = {
  id: string;
  title: string;
  created_at?: string;
  cover_url?: string | null;
  playlist_tracks?: PlaylistTrackRelation[] | null;
};

type PlaylistData = {
  id: string;
  title: string;
  created_at?: string;
  cover_url?: string | null;
  tracks: Track[];
};

function isAbsoluteUrl(value?: string | null) {
  return !!value && /^https?:\/\//i.test(value);
}

function getPublicFileUrl(
  bucket: "track-covers" | "track-audio",
  value?: string | null
) {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;

  return supabase.storage.from(bucket).getPublicUrl(value).data.publicUrl;
}

function getPublicCoverUrl(fileName?: string | null) {
  return getPublicFileUrl("track-covers", fileName);
}

function mapTrackToPlayerFormat(track: DbTrack): Track {
  const coverValue = track.cover_url ?? track.coverUrl ?? "";
  const audioValue = track.audio_url ?? track.audioUrl ?? "";

  const coverUrl =
    getPublicFileUrl("track-covers", coverValue) || "/placeholder-cover.jpg";

  const audioUrl = getPublicFileUrl("track-audio", audioValue) || "";

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

function buildPlaylistData(data: PlaylistRow): PlaylistData {
  const tracks: Track[] = (data.playlist_tracks ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => normalizeRelatedTrack(item.tracks))
    .filter(
      (track): track is DbTrack =>
        Boolean(track?.id && track?.title && track?.artist)
    )
    .map(mapTrackToPlayerFormat);

  return {
    id: data.id,
    title: data.title,
    created_at: data.created_at,
    cover_url: data.cover_url ?? null,
    tracks,
  };
}

function areTrackListsEqual(a: PlayableItem[], b: Track[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((item, index) => {
    if (item.type !== "track") return false;
    return item.id === b[index]?.id;
  });
}

export default function PlaylistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawPlaylistId = params?.id;
  const playlistId = Array.isArray(rawPlaylistId)
    ? rawPlaylistId[0]
    : rawPlaylistId ?? "";

  const setTrack = usePlayerStore((state) => state.setTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playerQueue = usePlayerStore((state) => state.queue);

  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState("");
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Cargando playlist...");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPlaylist = useCallback(async (): Promise<PlaylistData | null> => {
    if (!playlistId) {
      setMessage("Playlist no válida");
      setPlaylist(null);
      setAuthChecked(true);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError.message);
        setMessage("Error obteniendo sesión");
        setPlaylist(null);
        setAuthChecked(true);
        return null;
      }

      const user = sessionData.session?.user;

      if (!user) {
        setAuthChecked(true);
        setLoading(false);
        router.replace("/login");
        return null;
      }

      setAuthChecked(true);
      setUserId(user.id);

      const { data, error } = await supabase
        .from("playlists")
        .select(`
          id,
          title,
          created_at,
          cover_url,
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
        .eq("id", playlistId)
        .eq("user_id", user.id)
        .single<PlaylistRow>();

      if (error || !data) {
        console.error("Error obteniendo playlist:", error?.message);
        setMessage("No se pudo cargar la playlist");
        setPlaylist(null);
        return null;
      }

      const loadedPlaylist = buildPlaylistData(data);

      setPlaylist(loadedPlaylist);
      setEditedTitle(data.title ?? "");
      setMessage("");

      return loadedPlaylist;
    } catch (err) {
      console.error("Error inesperado cargando playlist:", err);
      setMessage("Ocurrió un error inesperado");
      setPlaylist(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [playlistId, router]);

  useEffect(() => {
    if (!mounted || !playlistId) return;
    void fetchPlaylist();
  }, [mounted, playlistId, fetchPlaylist]);

  useEffect(() => {
    if (!mounted || !playlistId) return;

    const handleFocus = () => {
      void fetchPlaylist();
    };

    const handlePlaylistUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ playlistId?: string }>;
      const updatedPlaylistId = customEvent.detail?.playlistId;

      if (!updatedPlaylistId || updatedPlaylistId === playlistId) {
        void fetchPlaylist();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "playlist:updated",
      handlePlaylistUpdated as EventListener
    );

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "playlist:updated",
        handlePlaylistUpdated as EventListener
      );
    };
  }, [mounted, playlistId, fetchPlaylist]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const reindexPlaylistPositions = useCallback(
    async (selectedPlaylistId: string) => {
      const { data, error } = await supabase
        .from("playlist_tracks")
        .select("id, position")
        .eq("playlist_id", selectedPlaylistId)
        .order("position", { ascending: true });

      if (error || !data) {
        console.error("Error leyendo posiciones:", error?.message);
        return false;
      }

      for (let i = 0; i < data.length; i += 1) {
        const row = data[i];

        const { error: updateError } = await supabase
          .from("playlist_tracks")
          .update({ position: i })
          .eq("id", row.id);

        if (updateError) {
          console.error("Error reindexando posiciones:", updateError.message);
          return false;
        }
      }

      return true;
    },
    []
  );

  const handleRemoveFromPlaylist = async (
    trackId: string,
    selectedPlaylistId: string
  ) => {
    const shouldSyncPlayerQueue =
      !!playlist && areTrackListsEqual(playerQueue, playlist.tracks);

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", selectedPlaylistId)
      .eq("track_id", trackId);

    if (error) {
      console.error("Error quitando track de playlist:", error.message);
      setToastMessage("No se pudo quitar la canción.");
      return;
    }

    await reindexPlaylistPositions(selectedPlaylistId);

    const refreshedPlaylist = await fetchPlaylist();

    if (shouldSyncPlayerQueue && refreshedPlaylist) {
      setQueue(
        refreshedPlaylist.tracks.map((track) => ({
          ...track,
          type: "track" as const,
        }))
      );
    }

    setToastMessage("Canción quitada de la playlist.");
  };

  const swapTrackPositions = async (
    currentTrackId: string,
    selectedPlaylistId: string,
    direction: "up" | "down"
  ) => {
    if (!playlist) return;

    const shouldSyncPlayerQueue = areTrackListsEqual(playerQueue, playlist.tracks);

    const currentIndex = playlist.tracks.findIndex(
      (track) => track.id === currentTrackId
    );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= playlist.tracks.length) return;

    const currentTrack = playlist.tracks[currentIndex];
    const targetTrack = playlist.tracks[targetIndex];

    const { data: relationRows, error: relationError } = await supabase
      .from("playlist_tracks")
      .select("id, track_id, position")
      .eq("playlist_id", selectedPlaylistId)
      .in("track_id", [currentTrack.id, targetTrack.id]);

    if (relationError) {
      console.error("Error leyendo posiciones:", relationError.message);
      setToastMessage("No se pudo reordenar la playlist.");
      return;
    }

    const currentRelation = relationRows?.find(
      (row) => row.track_id === currentTrack.id
    );
    const targetRelation = relationRows?.find(
      (row) => row.track_id === targetTrack.id
    );

    if (
      !currentRelation ||
      !targetRelation ||
      currentRelation.position == null ||
      targetRelation.position == null
    ) {
      setToastMessage("No se pudo reordenar la playlist.");
      return;
    }

    const { error: updateCurrentError } = await supabase
      .from("playlist_tracks")
      .update({ position: targetRelation.position })
      .eq("id", currentRelation.id);

    if (updateCurrentError) {
      console.error(
        "Error actualizando posición actual:",
        updateCurrentError.message
      );
      setToastMessage("No se pudo reordenar la playlist.");
      return;
    }

    const { error: updateTargetError } = await supabase
      .from("playlist_tracks")
      .update({ position: currentRelation.position })
      .eq("id", targetRelation.id);

    if (updateTargetError) {
      console.error(
        "Error actualizando posición destino:",
        updateTargetError.message
      );
      setToastMessage("No se pudo reordenar la playlist.");
      return;
    }

    const refreshedPlaylist = await fetchPlaylist();

    if (shouldSyncPlayerQueue && refreshedPlaylist) {
      setQueue(
        refreshedPlaylist.tracks.map((track) => ({
          ...track,
          type: "track" as const,
        }))
      );
    }

    setToastMessage("Playlist reordenada.");
  };

  const handleMoveUp = async (
    trackId: string,
    selectedPlaylistId: string
  ) => {
    await swapTrackPositions(trackId, selectedPlaylistId, "up");
  };

  const handleMoveDown = async (
    trackId: string,
    selectedPlaylistId: string
  ) => {
    await swapTrackPositions(trackId, selectedPlaylistId, "down");
  };

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.tracks.length === 0) return;

    setTrack(
      { ...playlist.tracks[0], type: "track" },
      playlist.tracks.map((track) => ({ ...track, type: "track" }))
    );
  };

  const handleStartEditTitle = () => {
    if (!playlist) return;
    setEditedTitle(playlist.title);
    setIsEditingTitle(true);
  };

  const handleCancelEditTitle = () => {
    setEditedTitle(playlist?.title ?? "");
    setIsEditingTitle(false);
  };

  const handleSaveTitle = async () => {
    const nextTitle = editedTitle.trim();

    if (!playlist || !nextTitle || savingTitle) return;

    setSavingTitle(true);

    const { error } = await supabase
      .from("playlists")
      .update({ title: nextTitle })
      .eq("id", playlist.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error renombrando playlist:", error.message);
      setSavingTitle(false);
      setToastMessage("No se pudo renombrar la playlist.");
      return;
    }

    setPlaylist((prev) =>
      prev
        ? {
            ...prev,
            title: nextTitle,
          }
        : prev
    );

    setIsEditingTitle(false);
    setSavingTitle(false);
    setToastMessage("Playlist renombrada.");
  };

  const handleDeletePlaylist = async () => {
    if (!playlist || deletingPlaylist) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la playlist "${playlist.title}"?`
    );

    if (!confirmed) return;

    setDeletingPlaylist(true);

    const shouldSyncPlayerQueue = areTrackListsEqual(playerQueue, playlist.tracks);

    const { error: relationsError } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlist.id);

    if (relationsError) {
      console.error(
        "Error eliminando relaciones de playlist:",
        relationsError.message
      );
      setDeletingPlaylist(false);
      setToastMessage("No se pudo eliminar la playlist.");
      return;
    }

    const { error: playlistError } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlist.id)
      .eq("user_id", userId);

    if (playlistError) {
      console.error("Error eliminando playlist:", playlistError.message);
      setDeletingPlaylist(false);
      setToastMessage("No se pudo eliminar la playlist.");
      return;
    }

    if (shouldSyncPlayerQueue) {
      setQueue([]);
    }

    router.push("/library?tab=playlists");
  };

  const handleUploadCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !playlist || !userId || uploadingCover) return;

    setUploadingCover(true);

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${playlist.id}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("track-covers")
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo portada:", uploadError.message);
      setUploadingCover(false);
      setToastMessage("No se pudo subir la portada.");
      return;
    }

    const { error: updateError } = await supabase
      .from("playlists")
      .update({ cover_url: fileName })
      .eq("id", playlist.id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error guardando portada:", updateError.message);
      setUploadingCover(false);
      setToastMessage("No se pudo guardar la portada.");
      return;
    }

    setPlaylist((prev) =>
      prev
        ? {
            ...prev,
            cover_url: fileName,
          }
        : prev
    );

    setUploadingCover(false);
    setToastMessage("Portada actualizada.");
    e.target.value = "";
  };

  if (!mounted || !authChecked) {
    return (
      <MainLayout>
        <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
          Cargando playlist...
        </div>
      </MainLayout>
    );
  }

  const playlistCover =
    getPublicCoverUrl(playlist?.cover_url) ||
    playlist?.tracks[0]?.coverUrl ||
    "/placeholder-cover.jpg";

  const totalDurationInSeconds = playlist
    ? playlist.tracks.reduce(
        (acc, track) => acc + (Number(track.duration) || 0),
        0
      )
    : 0;

  return (
    <MainLayout>
      <section className="relative mb-12">
        <Link
          href="/library?tab=playlists"
          className="mb-6 inline-flex text-sm text-zinc-400 transition hover:text-white"
        >
          ← Volver a playlists
        </Link>

        {loading ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Cargando playlist...
          </div>
        ) : message ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            {message}
          </div>
        ) : !playlist ? (
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
            Playlist no encontrada.
          </div>
        ) : (
          <>
            <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end">
                <div className="flex flex-col gap-3">
                  <div className="h-40 w-40 overflow-hidden rounded-2xl bg-white/10 shadow-xl">
                    <img
                      src={playlistCover}
                      alt={playlist.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <label className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                    {uploadingCover ? "Subiendo..." : "Cambiar portada"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCover}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
                    Playlist
                  </p>

                  {isEditingTitle ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full max-w-xl rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-2xl font-bold text-white outline-none focus:border-white/30 md:text-4xl"
                        placeholder="Nombre de la playlist"
                      />

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleSaveTitle}
                          disabled={savingTitle || !editedTitle.trim()}
                          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                          {savingTitle ? "Guardando..." : "Guardar"}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEditTitle}
                          disabled={savingTitle}
                          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold md:text-5xl">
                        {playlist.title}
                      </h1>

                      <p className="mt-3 text-sm text-zinc-400">
                        {playlist.tracks.length} canciones ·{" "}
                        {formatTime(totalDurationInSeconds)}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handlePlayPlaylist}
                          disabled={playlist.tracks.length === 0}
                          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                          Reproducir playlist
                        </button>

                        <button
                          type="button"
                          onClick={handleStartEditTitle}
                          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Renombrar
                        </button>

                        <button
                          type="button"
                          onClick={handleDeletePlaylist}
                          disabled={deletingPlaylist}
                          className="rounded-full border border-red-400/20 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deletingPlaylist ? "Eliminando..." : "Eliminar playlist"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {playlist.tracks.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-400">
                Esta playlist todavía no tiene canciones.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {playlist.tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    queue={playlist.tracks}
                    playlistId={playlist.id}
                    onRemoveFromPlaylist={handleRemoveFromPlaylist}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    canMoveUp={index > 0}
                    canMoveDown={index < playlist.tracks.length - 1}
                    index={index}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {toastMessage && (
          <div className="absolute right-0 top-0 z-30 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 shadow-lg backdrop-blur-sm">
            {toastMessage}
          </div>
        )}
      </section>
    </MainLayout>
  );
}