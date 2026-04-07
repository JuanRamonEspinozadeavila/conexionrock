import { Playlist } from "@/types/playlist";
import { tracks } from "./tracks";

export const playlists: Playlist[] = [
  {
    id: "1",
    title: "Chill Nights",
    description: "Una selección suave para relajarte y trabajar.",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop",
    tracks: [tracks[0], tracks[1]],
  },
  {
    id: "2",
    title: "Late Drive",
    description: "Sonidos nocturnos para carretera y ciudad.",
    coverUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    tracks: [tracks[1], tracks[2]],
  },
];