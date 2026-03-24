import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
const TABLE_NAME = "natasha_chat";

export async function GET() {
    try {
        const { data: dbData, error: dbError } = await supabase
            .from(TABLE_NAME)
            .select("id, role, text, created_at")
            .order("created_at", { ascending: true });

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        const history = (dbData || []).map(item => ({
            id: item.id,
            role: item.role,
            content: item.text,
            timestamp: new Date(item.created_at).getTime(),
            created_at: item.created_at,
        }));

        const limitedHistory = history.slice(-50);
        return NextResponse.json(limitedHistory);
    } catch (error) {
        return NextResponse.json({ error: "Gagal memuat riwayat." }, { status: 500 });
    }
}
