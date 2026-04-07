export type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
};

export type Podcast = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string | null;
};

export type PodcastEpisode = {
  id: string;
  podcastId: string;
  title: string;
  description?: string | null;
  audioUrl: string;
  coverUrl: string;
  duration: number;
  episodeNumber?: number | null;
  podcastTitle?: string;
  author?: string;
};

export type PlayableItem =
  | ({ type: "track" } & Track)
  | ({ type: "podcast_episode" } & PodcastEpisode);