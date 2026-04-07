"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Track } from "@/types/track";
import {
  type AppPlaylist,
  type DbTrack,
  type PlaylistWithRelations,
  mapPlaylistFromDb,
  mapTrackToPlayerFormat,
} from "@/lib/music";

type Options = {
  loadPlaylists?: boolean;
};

export function useMusicLibrary(options: Options = {}) {
  const { loadPlaylists = true } = options;

  const [mounted, setMounted] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<AppPlaylist[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select("*")
        .order("created_at", { ascending: false });

      if (tracksError) {
        setErrorMessage(`Error cargando canciones: ${tracksError.message}`);
        setLoading(false);
        return;
      }

      setTracks(((tracksData ?? []) as DbTrack[]).map(mapTrackToPlayerFormat));

      if (!loadPlaylists) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setErrorMessage(`Error obteniendo usuario: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!user) {
        setUserId("");
        setPlaylists([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

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
        setErrorMessage(`Error cargando playlists: ${playlistsError.message}`);
        setLoading(false);
        return;
      }

      setPlaylists(
        ((playlistsData ?? []) as PlaylistWithRelations[]).map(mapPlaylistFromDb)
      );
      setLoading(false);
    } catch (error) {
      console.error("Error inesperado cargando librería:", error);
      setErrorMessage("Ocurrió un error inesperado.");
      setLoading(false);
    }
  }, [loadPlaylists]);

  useEffect(() => {
    if (!mounted) return;
    void refetch();
  }, [mounted, refetch]);

  return {
    mounted,
    tracks,
    playlists,
    userId,
    loading,
    errorMessage,
    refetch,
    setPlaylists,
  };
}