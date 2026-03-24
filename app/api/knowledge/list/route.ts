// app/api/knowledge/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("list-rag")
            .select("id, title")
            .order("pinned", { ascending: false })
            .order("updated_at", { ascending: false, nullsFirst: false });

        if (error) throw error;

        const docs = (data || []).map(item => ({
            id: String(item.id),
            name: item.title,
        }));

        return NextResponse.json(docs);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
