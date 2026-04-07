export function getTrackColor(trackId: string) {
  const colors = [
    "from-indigo-500/45",
    "from-emerald-500/30",
    "from-rose-500/30",
    "from-amber-500/30",
    "from-cyan-500/30",
    "from-fuchsia-500/30",
  ];

  let hash = 0;

  for (let i = 0; i < trackId.length; i++) {
    hash = trackId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;

  return colors[index];
}