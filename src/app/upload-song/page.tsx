"use client";

import { FormEvent, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
export default function UploadPage() 





{
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debes iniciar sesión para subir canciones.");
      }

      if (!audioFile) {
        throw new Error("Debes seleccionar un archivo de audio.");
      }

      const cleanAudioName = sanitizeFileName(audioFile.name);
const cleanCoverName = coverFile ? sanitizeFileName(coverFile.name) : null;

const audioFileName = `${user.id}-${Date.now()}-${cleanAudioName}`;
const coverFileName = cleanCoverName
  ? `${user.id}-${Date.now()}-${cleanCoverName}`
  : null;

      const { error: audioError } = await supabase.storage
        .from("track-audio")
        .upload(audioFileName, audioFile);

      if (audioError) throw audioError;

      let coverPath: string | null = null;

      if (coverFile && coverFileName) {
        const { error: coverError } = await supabase.storage
          .from("track-covers")
          .upload(coverFileName, coverFile);

        if (coverError) throw coverError;

        coverPath = coverFileName;
      }

      const audioPath = audioFileName;

      const { error: insertError } = await supabase.from("tracks").insert({
        user_id: user.id,
        title,
        artist,
        audio_url: audioPath,
        cover_url: coverPath,
      });

      if (insertError) throw insertError;

      setMessage("Canción subida correctamente.");
      setTitle("");
      setArtist("");
      setAudioFile(null);
      setCoverFile(null);
    } catch (error: any) {
      setMessage(error.message || "Ocurrió un error al subir la canción.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Subir música
        </p>

        <h1 className="mb-6 text-3xl font-bold">Nueva canción</h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              placeholder="Nombre de la canción"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Artista</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
              placeholder="Nombre del artista"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Archivo de audio
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-300"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Portada (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Subiendo..." : "Subir canción"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-black/30 p-3 text-sm text-zinc-300">
            {message}
          </p>
        )}
      </div>
    </MainLayout>
  );
}