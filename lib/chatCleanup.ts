// lib/chatCleanup.ts
// Auto-cleanup records lama di table "natasha_chat" saat mendekati limit Supabase free tier

import { SupabaseClient } from "@supabase/supabase-js";

const CHAT_TABLE = "natasha_chat";
const CLEANUP_THRESHOLD = 931;
const CLEANUP_BATCH = 30;

/**
 * Cek total records di table natasha_chat.
 * Jika >= CLEANUP_THRESHOLD (930), hapus CLEANUP_BATCH (30) records paling lama.
 */
export async function cleanupOldChats(
    supabase: SupabaseClient
): Promise<{ deleted: number; remaining: number }> {
    const { count, error: countError } = await supabase
        .from(CHAT_TABLE)
        .select("id", { count: "exact", head: true });

    if (countError) {
        console.error("[CLEANUP] ❌ Gagal hitung total records:", countError.message);
        return { deleted: 0, remaining: -1 };
    }

    const total = count ?? 0;

    if (total < CLEANUP_THRESHOLD) {
        console.log(`[CLEANUP] Total records: ${total}, di bawah threshold (${CLEANUP_THRESHOLD}). Skip.`);
        return { deleted: 0, remaining: total };
    }

    const { data: oldestRows, error: fetchError } = await supabase
        .from(CHAT_TABLE)
        .select("id")
        .order("created_at", { ascending: true })
        .limit(CLEANUP_BATCH);

    if (fetchError || !oldestRows || oldestRows.length === 0) {
        console.error("[CLEANUP] ❌ Gagal fetch records lama:", fetchError?.message);
        return { deleted: 0, remaining: total };
    }

    const idsToDelete = oldestRows.map((row) => row.id);

    const { error: deleteError } = await supabase
        .from(CHAT_TABLE)
        .delete()
        .in("id", idsToDelete);

    if (deleteError) {
        console.error("[CLEANUP] ❌ Gagal hapus records:", deleteError.message);
        return { deleted: 0, remaining: total };
    }

    const remaining = total - idsToDelete.length;
    console.log(
        `[CLEANUP] ✅ Berhasil hapus ${idsToDelete.length} records lama. Sisa: ${remaining}`
    );

    return { deleted: idsToDelete.length, remaining };
}
