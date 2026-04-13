export function getTrackColor(trackId: string) {
  const palettes = [
    "from-fuchsia-600/70",
    "from-violet-600/70",
    "from-purple-600/70",
    "from-rose-600/70",
    "from-red-600/70",
    "from-orange-500/70",
    "from-amber-500/70",
    "from-emerald-600/70",
    "from-teal-600/70",
    "from-sky-600/70",
    "from-blue-600/70",
    "from-indigo-600/70",
  ];

  if (!trackId) return "from-zinc-900/80";

  let hash = 0;

  for (let i = 0; i < trackId.length; i += 1) {
    hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palettes[Math.abs(hash) % palettes.length];
}