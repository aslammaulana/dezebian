// app/api/chat/memory-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHAT_TABLE = "natasha_chat";
const MEMORY_TABLE = "natasha_memory";
const CHUNK_SIZE = 15;

export async function GET(req: NextRequest) {
    try {
        const milestoneParam = req.nextUrl.searchParams.get("milestone");

        if (milestoneParam) {
            const milestoneNum = parseInt(milestoneParam, 10);
            if (isNaN(milestoneNum) || milestoneNum < 1) {
                return NextResponse.json({ error: "Milestone harus berupa angka >= 1" }, { status: 400 });
            }
            const { data, error } = await supabase
                .from(MEMORY_TABLE)
                .select("summary, updated_at")
                .eq("milestone", milestoneNum)
                .maybeSingle();
            if (error) throw new Error(`Gagal load summary: ${error.message}`);
            if (!data) return NextResponse.json({ summary: null, updated_at: null });
            return NextResponse.json({ summary: data.summary, updated_at: data.updated_at });
        }

        const { data: memoryRows, error: memError } = await supabase
            .from(MEMORY_TABLE)
            .select("milestone, chat_id_start, chat_id_end, updated_at")
            .order("milestone", { ascending: true });

        if (memError) throw new Error(`Gagal load memory: ${memError.message}`);

        const memoryMap = new Map<number, { chat_id_start: number; chat_id_end: number; updated_at: string }>();
        for (const row of memoryRows || []) {
            memoryMap.set(row.milestone, {
                chat_id_start: row.chat_id_start,
                chat_id_end: row.chat_id_end,
                updated_at: row.updated_at,
            });
        }

        const maxExistingMilestone = memoryMap.size > 0 ? Math.max(...Array.from(memoryMap.keys())) : 0;
        const lastExistingRow = maxExistingMilestone > 0 ? memoryMap.get(maxExistingMilestone) : null;
        const lastCoveredId = lastExistingRow?.chat_id_end ?? 0;

        const { data: pendingChatRows, error: pendingError } = await supabase
            .from(CHAT_TABLE)
            .select("id")
            .neq("role", "system")
            .gt("id", lastCoveredId)
            .order("id", { ascending: true });

        if (pendingError) throw new Error(`Gagal load pending chats: ${pendingError.message}`);

        const pendingIds: number[] = (pendingChatRows || []).map(r => r.id);
        const newMilestonesNeeded = Math.floor(pendingIds.length / CHUNK_SIZE);
        const totalMilestones = maxExistingMilestone + newMilestonesNeeded;

        const milestones = [];

        for (let i = 1; i <= maxExistingMilestone; i++) {
            const existing = memoryMap.get(i);
            milestones.push({
                milestone: i,
                status: "done",
                idRange: existing?.chat_id_start != null && existing?.chat_id_end != null
                    ? `${existing.chat_id_start}-${existing.chat_id_end}` : "N/A",
                idStart: existing?.chat_id_start ?? null,
                idEnd: existing?.chat_id_end ?? null,
                updated_at: existing?.updated_at || null,
            });
        }

        for (let i = 0; i < newMilestonesNeeded; i++) {
            const milestoneNum = maxExistingMilestone + i + 1;
            const chunkStart = i * CHUNK_SIZE;
            const chunkEnd = chunkStart + CHUNK_SIZE - 1;
            milestones.push({
                milestone: milestoneNum,
                status: "pending",
                idRange: pendingIds[chunkStart] && pendingIds[chunkEnd]
                    ? `${pendingIds[chunkStart]}-${pendingIds[chunkEnd]}` : "N/A",
                idStart: pendingIds[chunkStart] ?? null,
                idEnd: pendingIds[chunkEnd] ?? null,
                updated_at: null,
            });
        }

        const { count: totalChats } = await supabase
            .from(CHAT_TABLE)
            .select("id", { count: "exact", head: true })
            .neq("role", "system");

        const remainingChats = pendingIds.length - (newMilestonesNeeded * CHUNK_SIZE);

        return NextResponse.json({
            totalChats: totalChats ?? 0,
            totalMilestones,
            remainingChats,
            milestones,
            hasPending: milestones.some(m => m.status === "pending"),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
