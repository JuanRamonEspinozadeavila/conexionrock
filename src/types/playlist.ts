import { Track } from "./track";

export type Playlist = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
};