"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  House,
  Search,
  Library,
  Heart,
  Menu,
  X,
  ListMusic,
  Music2,
} from "lucide-react";
import { useLibraryStore } from "../../stores/libraryStore";
import { playlists } from "../../data/playlists";

const navItems = [
  {
    label: "Inicio",
    href: "/home",
    icon: House,
  },
  {
    label: "Buscar",
    href: "/search",
    icon: Search,
  },
  {
    label: "Tu biblioteca",
    href: "/library",
    icon: Library,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { savedTracks, hasHydrated } = useLibraryStore();

  const favoriteCount = hasHydrated ? savedTracks.length : 0;
  const playlistCount = playlists.length;

  const favoritePreviews = hasHydrated
    ? [...savedTracks]
        .slice(-3)
        .reverse()
        .map((track) => track.coverUrl)
    : [];

  const playlistPreviews = playlists.slice(0, 3).map((playlist) => playlist.coverUrl);

  const collectionItems = [
    {
      label: "Tus favoritas",
      href: "/library?tab=liked",
      icon: Heart,
      meta: `${favoriteCount} canción${favoriteCount === 1 ? "" : "es"}`,
      previews: favoritePreviews,
      fallbackType: "favorites" as const,
    },
    {
      label: "Mis playlists",
      href: "/library?tab=playlists",
      icon: ListMusic,
      meta: `${playlistCount} playlist${playlistCount === 1 ? "" : "s"}`,
      previews: playlistPreviews,
      fallbackType: "playlist" as const,
    },
  ];

  const renderPreviewStack = (
    previews: string[],
    fallbackType: "favorites" | "playlist"
  ) => {
    if (previews.length > 0) {
      return (
        <div className="relative h-12 w-16">
          {previews.slice(0, 3).map((imageUrl, index) => (
            <img
              key={`${imageUrl}-${index}`}
              src={imageUrl}
              alt=""
              className="absolute top-0 h-12 w-12 rounded-xl border border-white/10 object-cover shadow-lg"
              style={{
                left: `${index * 12}px`,
                zIndex: 30 - index,
              }}
            />
          ))}
        </div>
      );
    }

    if (fallbackType === "favorites") {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
          <Heart size={18} />
        </div>
      );
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
        <Music2 size={18} />
      </div>
    );
  };

  const renderSidebarContent = (isMobile = false) => (
    <>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-black"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={isMobile ? "mt-8" : "mt-0"}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Colección
          </p>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            dinámica
          </span>
        </div>

        <div className="space-y-3">
          {collectionItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className="block rounded-2xl bg-zinc-900 p-3 transition hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                {renderPreviewStack(item.previews, item.fallbackType)}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.label}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {item.meta}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
            M
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Tu música
            </p>
            <h1 className="text-base font-bold text-white">ConexionRock</h1>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
        >
          <Menu size={18} />
        </button>
      </div>

      <aside className="hidden w-72 flex-col gap-2 md:flex">
        <div className="rounded-2xl bg-zinc-950 p-5">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
              M
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                promueve tu música
              </p>
              <h1 className="text-lg font-bold text-white">ConexionRock</h1>
            </div>
          </div>

          {renderSidebarContent(false)}
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 z-50 h-full w-72 bg-zinc-950 p-5 transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
              M
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Música | Podcast | Cultura
              </p>
              <h1 className="text-base font-bold text-white">ConexionRock</h1>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {renderSidebarContent(true)}
      </div>
    </>
  );
}