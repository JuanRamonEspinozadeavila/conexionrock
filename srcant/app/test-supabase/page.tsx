import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";

export default async function TestSupabasePage() {
  const { data, error } = await supabase.from("tracks").select("*");

  return (
    <MainLayout>
      <div className="rounded-2xl bg-zinc-900 p-6 text-white">
        <h1 className="mb-4 text-2xl font-bold">Prueba Supabase</h1>

        {error ? (
          <p className="text-red-400">Error: {error.message}</p>
        ) : (
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </MainLayout>
  );
}