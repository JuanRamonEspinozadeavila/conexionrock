"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "./LogoutButton";

export default function UserInfo() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    };

    loadUser();
  }, []);

  if (!email) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm text-zinc-300">
        Usuario: <span className="font-medium text-white">{email}</span>
      </p>

      <LogoutButton />
    </div>
  );
}