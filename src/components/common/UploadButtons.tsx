"use client";

import Link from "next/link";
import { Upload, Mic2 } from "lucide-react";

export default function UploadButtons() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/upload-song"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
      >
        <Upload size={16} />
        Subir canción
      </Link>

      <Link
        href="/upload-podcast"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        <Mic2 size={16} />
        Subir podcast
      </Link>
    </div>
  );
}