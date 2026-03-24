// app/api/knowledge/save-rag/route.ts
// Menyimpan satu baris reels-content sebagai dokumen RAG di list-rag

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, context } = body;

        if (!title || !context) {
            return NextResponse.json({ error: "title dan context wajib diisi" }, { status: 400 });
        }

        // Cek apakah sudah ada RAG dengan judul yang sama
        const { data: existing } = await supabase
            .from("list-rag")
            .select("id")
            .eq("title", title)
            .maybeSingle();

        if (existing?.id) {
            // Update jika sudah ada
            const { error } = await supabase
                .from("list-rag")
                .update({ context, updated_at: new Date().toISOString() })
                .eq("id", existing.id);

            if (error) throw error;
            return NextResponse.json({ success: true, action: "updated", id: existing.id });
        } else {
            // Insert baru
            const { data, error } = await supabase
                .from("list-rag")
                .insert({ title, context })
                .select("id")
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, action: "created", id: data.id });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
