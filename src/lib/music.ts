import { supabase } from "@/lib/supabase";
import type { Track } from "@/types/track";

export type DbTrack = {
  id: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  audio_url?: string | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
  created_at?: string | null;
};

export type PlaylistTrackRelation = {
  id: string;
  position: number;
  track_id: string;
  tracks: DbTrack | DbTrack[] | null;
};

export type PlaylistWithRelations = {
  id: string;
  title: string;
  created_at?: string;
  cover_url?: string | null;
  playlist_tracks?: PlaylistTrackRelation[];
};

export type AppPlaylist = {
  id: string;
  title: string;
  created_at?: string;
  cover_url?: string | null;
  tracks?: Track[];
};

export function isAbsoluteUrl(value?: string | null) {
  return !!value && /^https?:\/\//i.test(value);
}

export function getPublicFileUrl(
  bucket: "track-covers" | "track-audio",
  value?: string | null
) {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;

  return supabase.storage.from(bucket).getPublicUrl(value).data.publicUrl;
}

export function getPublicCoverUrl(fileName?: string | null) {
  return getPublicFileUrl("track-covers", fileName);
}

export function mapTrackToPlayerFormat(track: DbTrack): Track {
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

export function normalizeRelatedTrack(
  value: DbTrack | DbTrack[] | null | undefined
): DbTrack | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapPlaylistFromDb(
  playlist: PlaylistWithRelations
): AppPlaylist {
  return {
    id: playlist.id,
    title: playlist.title,
    created_at: playlist.created_at,
    cover_url: playlist.cover_url ?? null,
    tracks: (playlist.playlist_tracks ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => normalizeRelatedTrack(item.tracks))
      .filter(
        (track): track is DbTrack =>
          Boolean(track?.id && track?.title && track?.artist)
      )
      .map(mapTrackToPlayerFormat),
  };
}