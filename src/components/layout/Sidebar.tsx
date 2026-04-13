"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House,
  Search,
  Library,
  Heart,
  Menu,
  X,
  ListMusic,
  Music2,
  Mic2,
  Upload,
  LogIn,
} from "lucide-react";
import { useLibraryStore } from "@/stores/libraryStore";
import { playlists } from "@/data/playlists";
import { supabase } from "@/lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: typeof House;
};

const publicNavItems: NavItem[] = [
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
    label: "Podcasts",
    href: "/podcasts",
    icon: Mic2,
  },
];

const privateNavItems: NavItem[] = [
  {
    label: "Tu biblioteca",
    href: "/library",
    icon: Library,
  },
  {
    label: "Mis playlists",
    href: "/library?tab=playlists",
    icon: ListMusic,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { savedTracks, hasHydrated } = useLibraryStore();

  useEffect(() => {
    let isActive = true;

    setMounted(true);

    if (!useLibraryStore.persist.hasHydrated()) {
      useLibraryStore.persist.rehydrate();
    }

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!isActive) return;

      if (error || !data.user) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const isGuest = isAuthenticated === false;
  const isLoggedIn = isAuthenticated === true;

  const navItems = isLoggedIn
    ? [...publicNavItems, ...privateNavItems]
    : publicNavItems;

  const favoriteCount = mounted && hasHydrated ? savedTracks.length : 0;
  const playlistCount = playlists.length;

  const favoritePreviews =
    mounted && hasHydrated
      ? [...savedTracks].slice(-3).reverse().map((track) => track.coverUrl)
      : [];

  const playlistPreviews = playlists
    .slice(0, 3)
    .map((playlist) => playlist.coverUrl);

  const collectionItems = isLoggedIn
    ? [
        {
          label: "Tus favoritas",
          href: "/liked",
          icon: Heart,
          meta: `${favoriteCount} canción${favoriteCount === 1 ? "" : "es"}`,
          previews: favoritePreviews,
          fallbackType: "favorites" as const,
        },
        {
          label: "Playlists destacadas",
          href: "/#playlists",
          icon: ListMusic,
          meta: `${playlistCount} playlist${playlistCount === 1 ? "" : "s"}`,
          previews: playlistPreviews,
          fallbackType: "playlist" as const,
        },
      ]
    : [
        {
          label: "Playlists destacadas",
          href: "/#playlists",
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

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/library") {
      return pathname === "/library" && currentTab !== "playlists";
    }

    if (href === "/library?tab=playlists") {
      return pathname === "/library" && currentTab === "playlists";
    }

    return pathname === href;
  };

  const renderSidebarContent = (isMobile = false) => (
    <>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isLinkActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border border-white/10 bg-zinc-900 text-zinc-200"
                  : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3">
        {isLoggedIn ? (
          <>
            <Link
              href="/upload-song"
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className="flex items-center justify-center gap-2 rounded-full bg-zinc-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              <Upload size={16} />
              <span>Subir canción</span>
            </Link>

            <Link
              href="/upload-podcast"
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Mic2 size={16} />
              <span>Subir podcast</span>
            </Link>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
              <p className="text-sm font-semibold text-white">Modo invitado</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Puedes explorar la app, pero para guardar favoritos, crear
                playlists o subir contenido necesitas iniciar sesión.
              </p>
            </div>

            <Link
              href="/login"
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className="flex items-center justify-center gap-2 rounded-full bg-zinc-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              <LogIn size={16} />
              <span>Iniciar sesión</span>
            </Link>
          </>
        )}
      </div>

      <div className={isMobile ? "mt-8" : "mt-6"}>
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

  if (!mounted) {
    return (
      <>
        <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
              <img
                src="https://conexionrock.com/wp-content/uploads/2021/09/cropped-cropped-cropped-logoconexionrockpng-11-e1761364452989.png"
                alt=""
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Música | Podcast | Cultura
              </p>
              <h1 className="text-base font-bold text-white">ConexionRock</h1>
            </div>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
          >
            <Menu size={18} />
          </button>
        </div>

        <aside className="hidden w-72 flex-col gap-2 md:flex">
          <div className="rounded-2xl bg-zinc-950 p-5">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                <img
                  src="https://conexionrock.com/wp-content/uploads/2021/09/cropped-cropped-cropped-logoconexionrockpng-11-e1761364452989.png"
                  alt=""
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Música | Podcast | Cultura
                </p>
                <h1 className="text-base font-bold text-white">ConexionRock</h1>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
            <img
              src="https://conexionrock.com/wp-content/uploads/2021/09/cropped-cropped-cropped-logoconexionrockpng-11-e1761364452989.png"
              alt=""
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Música | Podcast | Cultura
            </p>
            <h1 className="text-base font-bold text-white">ConexionRock</h1>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
          type="button"
        >
          <Menu size={18} />
        </button>
      </div>

      <aside className="hidden w-72 flex-col gap-2 md:flex">
        <div className="rounded-2xl bg-zinc-950 p-5">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
              <img
                src="https://conexionrock.com/wp-content/uploads/2021/09/cropped-cropped-cropped-logoconexionrockpng-11-e1761364452989.png"
                alt=""
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Música | Podcast | Cultura
              </p>
              <h1 className="text-base font-bold text-white">ConexionRock</h1>
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
              <img
                src="https://conexionrock.com/wp-content/uploads/2021/09/cropped-cropped-cropped-logoconexionrockpng-11-e1761364452989.png"
                alt=""
              />
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
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {renderSidebarContent(true)}
      </div>
    </>
  );
}