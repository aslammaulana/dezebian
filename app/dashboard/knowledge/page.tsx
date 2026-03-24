// app/dashboard/knowledge/page.tsx
import type { Metadata } from "next";
import KnowledgeClient from "@/components/knowledge/KnowledgeClient";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
    title: "Knowledge Base | Dezebian",
    description: "Kelola referensi dan konteks untuk Natasha AI",
};

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: result, error } = await supabase
        .from("list-rag")
        .select("*")
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-10 text-white">Gagal memuat data: {error.message}</div>;
    }

    return <KnowledgeClient initialData={result || []} />;
}
