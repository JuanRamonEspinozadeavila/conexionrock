"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import PlayerBar from "../player/PlayerBar";
import { usePlayerStore } from "@/stores/playerStore";
import { getTrackColor } from "@/lib/getTrackColor";

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dynamicColor = useMemo(() => {
    if (!mounted || !currentTrack) return "from-zinc-900/80";
    return getTrackColor(currentTrack.id);
  }, [mounted, currentTrack]);

  return (
    <div className="h-screen overflow-hidden bg-black text-white">
      <div className="flex h-[calc(100vh-104px)] flex-col gap-2 p-2 md:flex-row">
        {mounted ? (
          <Sidebar />
        ) : (
          <div className="hidden w-[280px] rounded-2xl bg-zinc-950 md:block" />
        )}

        <main className="relative flex-1 overflow-y-auto overflow-x-hidden rounded-2xl bg-black">
          <div
            className={`absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b ${dynamicColor} via-transparent to-transparent transition-all duration-[1800ms] ease-out`}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-60 transition-all duration-[2200ms] ease-out" />

          <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-white/10 blur-3xl transition-all duration-[2000ms] ease-out" />
          <div className="pointer-events-none absolute right-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-white/5 blur-3xl transition-all duration-[2000ms] ease-out" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />

          <div className="relative z-10 p-5 md:p-8">{children}</div>
        </main>
      </div>

      <div className="px-2 pb-2">
        {mounted ? (
          <PlayerBar />
        ) : (
          <div className="h-[96px] rounded-2xl bg-zinc-950" />
        )}
      </div>
    </div>
  );
}