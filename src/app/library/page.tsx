import LibraryPageClient from "./LibraryPageClient";

type Tab = "uploads" | "liked" | "playlists";

type SearchParams = Promise<{
  tab?: string | string[];
}>;

function resolveTab(value?: string | string[]): Tab {
  const tab = Array.isArray(value) ? value[0] : value;

  if (tab === "liked") return "liked";
  if (tab === "playlists") return "playlists";
  return "uploads";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialTab = resolveTab(params?.tab);

  return <LibraryPageClient initialTab={initialTab} />;
}