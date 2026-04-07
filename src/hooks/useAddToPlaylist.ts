"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AppPlaylist } from "@/lib/music";
import type { Track } from "@/types/track";

type Props = {
  playlists: AppPlaylist[];
  setPlaylists: React.Dispatch<React.SetStateAction<AppPlaylist[]>>;
  userId: string;
};

export function useAddToPlaylist({
  playlists,
  setPlaylists,
  userId,
}: Props) {
  const [toastMessage, setToastMessage] = useState("");
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] =
    useState<Track | null>(null);
  const [addingTrackToPlaylist, setAddingTrackToPlaylist] = useState(false);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = setTimeout(() => {
      setToastMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const closePlaylistPicker = () => {
    setIsPlaylistPickerOpen(false);
    setSelectedTrackForPlaylist(null);
    setAddingTrackToPlaylist(false);
  };

  const addTrackToPlaylist = async (track: Track, playlist: AppPlaylist) => {
    try {
      setAddingTrackToPlaylist(true);

      const alreadyExists = (playlist.tracks ?? []).some(
        (item) => item.id === track.id
      );

      if (alreadyExists) {
        setToastMessage(`"${track.title}" ya está en "${playlist.title}".`);
        closePlaylistPicker();
        return;
      }

      const { data: lastPositionRow, error: lastPositionError } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlist.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPositionError) {
        console.error("Error obteniendo última posición:", lastPositionError);
        setToastMessage("No se pudo calcular la posición en la playlist.");
        return;
      }

      const nextPosition = Number(lastPositionRow?.position ?? -1) + 1;

      const { error: insertError } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlist.id,
          track_id: track.id,
          position: nextPosition,
        });

      if (insertError) {
        console.error("Error agregando track a playlist:", insertError);
        setToastMessage(`Error agregando a playlist: ${insertError.message}`);
        return;
      }

      setPlaylists((prev) =>
        prev.map((item) =>
          item.id === playlist.id
            ? {
                ...item,
                tracks: [...(item.tracks ?? []), track],
              }
            : item
        )
      );

      window.dispatchEvent(
        new CustomEvent("playlist:updated", {
          detail: { playlistId: playlist.id },
        })
      );

      setToastMessage(`"${track.title}" agregada a "${playlist.title}".`);
      closePlaylistPicker();
    } catch (error) {
      console.error("Error inesperado agregando track a playlist:", error);
      setToastMessage("Error inesperado agregando track a playlist.");
    } finally {
      setAddingTrackToPlaylist(false);
    }
  };

  const handleAddTrackToPlaylist = async (track: Track) => {
    if (!userId) {
      setToastMessage(
        "Necesitas iniciar sesión para guardar canciones en playlists."
      );
      return;
    }

    if (playlists.length === 0) {
      setToastMessage("Primero crea una playlist.");
      return;
    }

    if (playlists.length === 1) {
      await addTrackToPlaylist(track, playlists[0]);
      return;
    }

    setSelectedTrackForPlaylist(track);
    setIsPlaylistPickerOpen(true);
  };

  return {
    toastMessage,
    isPlaylistPickerOpen,
    selectedTrackForPlaylist,
    addingTrackToPlaylist,
    closePlaylistPicker,
    addTrackToPlaylist,
    handleAddTrackToPlaylist,
  };
}