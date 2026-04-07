"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TrackCard, { Track } from "../../components/track/TrackCard";
import { supabase } from "../../lib/supabase";

type Playlist = {
  id: string;
  user_id: string;
  title: string;
  cover_url: string | null;
};

type PlaylistTrackRow = {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  created_at?: string;
  tracks: {
    id: string;
    title: string;
    artist: string;
    cover_url: string;
    audio_url: string;
    duration: number;
  } | null;
};

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params.id as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playlistId) return;

    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error loading current user:", error);
        setCurrentUserId(null);
      } else {
        setCurrentUserId(user?.id ?? null);
        console.log("currentUserId:", user?.id ?? null);
      }

      setAuthChecked(true);
      await loadPlaylist();
    };

    init();
  }, [playlistId]);

  const loadPlaylist = async () => {
    setLoading(true);

    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("id, user_id, title, cover_url")
      .eq("id", playlistId)
      .single();

    if (playlistError) {
      console.error("Error loading playlist:", playlistError);
      setPlaylist(null);
      setTracks([]);
      setPositions({});
      setLoading(false);
      return;
    }

    setPlaylist(playlistData as Playlist);

    const { data: playlistTracksData, error: playlistTracksError } =
      await supabase
        .from("playlist_tracks")
        .select(
          `
          id,
          playlist_id,
          track_id,
          position,
          created_at,
          tracks (
            id,
            title,
            artist,
            cover_url,
            audio_url,
            duration
          )
        `
        )
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

    if (playlistTracksError) {
      console.error("Error loading playlist tracks:", playlistTracksError);
      setTracks([]);
      setPositions({});
      setLoading(false);
      return;
    }

    const rows = (playlistTracksData ?? []) as unknown as PlaylistTrackRow[];

    const mappedTracks: Track[] = rows
      .filter((row) => row.tracks)
      .map((row) => ({
        id: row.tracks!.id,
        title: row.tracks!.title,
        artist: row.tracks!.artist,
        coverUrl: row.tracks!.cover_url,
        audioUrl: row.tracks!.audio_url,
        duration: row.tracks!.duration,
      }));

    const mappedPositions = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.track_id] = row.position;
      return acc;
    }, {});

    setTracks(mappedTracks);
    setPositions(mappedPositions);
    setLoading(false);
  };

  const reindexPlaylistPositions = async (nextTracks: Track[]) => {
    const updates = nextTracks.map((track, index) => ({
      trackId: track.id,
      position: index,
    }));

    for (const item of updates) {
      const { error } = await supabase
        .from("playlist_tracks")
        .update({ position: item.position })
        .eq("playlist_id", playlistId)
        .eq("track_id", item.trackId);

      if (error) {
        console.error("Error reindexing track:", error);
      }
    }

    const nextPositions = nextTracks.reduce<Record<string, number>>(
      (acc, track, index) => {
        acc[track.id] = index;
        return acc;
      },
      {}
    );

    setPositions(nextPositions);
  };

  const onRemoveFromPlaylist = async (
    trackId: string,
    currentPlaylistId: string
  ) => {
    const previousTracks = [...tracks];
    const previousPositions = { ...positions };

    const nextTracks = tracks.filter((track) => track.id !== trackId);
    setTracks(nextTracks);

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", currentPlaylistId)
      .eq("track_id", trackId);

    if (error) {
      console.error("Error removing track from playlist:", error);
      setTracks(previousTracks);
      setPositions(previousPositions);
      alert("No se pudo quitar la canción.");
      return;
    }

    await reindexPlaylistPositions(nextTracks);
  };

  const swapTrackPositions = async (
    currentTrackId: string,
    targetTrackId: string
  ) => {
    const currentIndex = tracks.findIndex((track) => track.id === currentTrackId);
    const targetIndex = tracks.findIndex((track) => track.id === targetTrackId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const currentPosition = positions[currentTrackId];
    const targetPosition = positions[targetTrackId];

    if (
      typeof currentPosition !== "number" ||
      typeof targetPosition !== "number"
    ) {
      return;
    }

    const previousTracks = [...tracks];
    const previousPositions = { ...positions };

    const nextTracks = [...tracks];
    [nextTracks[currentIndex], nextTracks[targetIndex]] = [
      nextTracks[targetIndex],
      nextTracks[currentIndex],
    ];

    setTracks(nextTracks);
    setPositions({
      ...positions,
      [currentTrackId]: targetPosition,
      [targetTrackId]: currentPosition,
    });

    const firstUpdate = await supabase
      .from("playlist_tracks")
      .update({ position: targetPosition })
      .eq("playlist_id", playlistId)
      .eq("track_id", currentTrackId);

    const secondUpdate = await supabase
      .from("playlist_tracks")
      .update({ position: currentPosition })
      .eq("playlist_id", playlistId)
      .eq("track_id", targetTrackId);

    if (firstUpdate.error || secondUpdate.error) {
      console.error(
        "Error swapping positions:",
        firstUpdate.error || secondUpdate.error
      );
      setTracks(previousTracks);
      setPositions(previousPositions);
      alert("No se pudo reordenar la canción.");
      return;
    }

    const fixedPositions = nextTracks.reduce<Record<string, number>>(
      (acc, track, index) => {
        acc[track.id] = index;
        return acc;
      },
      {}
    );

    setPositions(fixedPositions);
  };

  const onMoveUp = async (trackId: string) => {
    const currentIndex = tracks.findIndex((track) => track.id === trackId);
    if (currentIndex <= 0) return;

    const targetTrack = tracks[currentIndex - 1];
    await swapTrackPositions(trackId, targetTrack.id);
  };

  const onMoveDown = async (trackId: string) => {
    const currentIndex = tracks.findIndex((track) => track.id === trackId);
    if (currentIndex === -1 || currentIndex >= tracks.length - 1) return;

    const targetTrack = tracks[currentIndex + 1];
    await swapTrackPositions(trackId, targetTrack.id);
  };

  if (loading) {
    return <main className="p-6 text-zinc-400">Cargando playlist...</main>;
  }

  if (!playlist) {
    return <main className="p-6 text-red-400">Playlist no encontrada.</main>;
  }

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-28 w-28 overflow-hidden rounded-xl bg-zinc-800">
          {playlist.cover_url ? (
            <img
              src={playlist.cover_url}
              alt={playlist.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Sin portada
            </div>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-400">
            Playlist
          </p>
          <h1 className="text-3xl font-bold text-white">{playlist.title}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {tracks.length} canción{tracks.length === 1 ? "" : "es"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            authChecked: {authChecked ? "sí" : "no"} | currentUserId:{" "}
            {currentUserId ?? "null"}
          </p>
        </div>
      </div>

      {!tracks.length ? (
        <p className="text-zinc-400">Esta playlist no tiene canciones.</p>
      ) : (
        <div className="space-y-3">
          {tracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              queue={tracks}
              userId={currentUserId ?? undefined}
              playlistId={playlistId}
              index={index}
              onRemoveFromPlaylist={onRemoveFromPlaylist}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              canMoveUp={index > 0}
              canMoveDown={index < tracks.length - 1}
            />
          ))}
        </div>
      )}
    </main>
  );
}