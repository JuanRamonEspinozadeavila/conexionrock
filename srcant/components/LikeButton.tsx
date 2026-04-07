"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LikeButtonProps = {
  trackId: string;
  userId: string;
};

export default function LikeButton({ trackId, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkIfLiked = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("song_id", trackId)
        .maybeSingle();

      if (!error) {
        setLiked(!!data);
      }
    };

    checkIfLiked();
  }, [trackId, userId]);

  const toggleLike = async () => {
    if (!userId || loading) return;

    setLoading(true);

    if (liked) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("song_id", trackId);

      if (!error) setLiked(false);
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        song_id: trackId,
      });

      if (!error) setLiked(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggleLike}
      disabled={loading || !userId}
      className="text-xl transition hover:scale-110"
      aria-label={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      {liked ? "❤️" : "🤍"}
    </button>
  );
}