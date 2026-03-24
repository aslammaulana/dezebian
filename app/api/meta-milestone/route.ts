// app/api/meta-milestone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { currentKeyIndex, rotateKey } from "@/lib/geminiKeyState";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MEMORY_TABLE = "natasha_memory";
const META_TABLE = "natasha_meta_milestone";
const MILESTONES_PER_META = 5;

const apiKeys: string[] = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
    process.env.GEMINI_API_KEY6,
    process.env.GEMINI_API_KEY7,
    process.env.GEMINI_API_KEY8,
    process.env.GEMINI_API_KEY9,
    process.env.GEMINI_API_KEY10,
    process.env.GEMINI_API_KEY11,
    process.env.GEMINI_API_KEY12,
    process.env.GEMINI_API_KEY13,
    process.env.GEMINI_API_KEY14,
    process.env.GEMINI_API_KEY15,
].filter((k): k is string => Boolean(k));

function isApiKeyError(err: any): boolean {
    const message = err?.message?.toLowerCase() || "";
    return (
        err?.status === 429 || err?.status === 401 || err?.status === 403 || err?.status === 503 ||
        message.includes("quota") || message.includes("key") ||
        message.includes("unavailable") || message.includes("overloaded")
    );
}

// GET — List status meta-milestone (atau single summary ?meta_number=N)
export async function GET(req: NextRequest) {
    try {
        const metaNumberParam = req.nextUrl.searchParams.get("meta_number");

        if (metaNumberParam) {
            const metaNum = parseInt(metaNumberParam, 10);
            if (isNaN(metaNum) || metaNum < 1) return NextResponse.json({ error: "meta_number harus angka >= 1" }, { status: 400 });
            const { data, error } = await supabase.from(META_TABLE).select("summary, updated_at").eq("meta_number", metaNum).maybeSingle();
            if (error) throw new Error(`Gagal load summary: ${error.message}`);
            if (!data) return NextResponse.json({ summary: null, updated_at: null });
            return NextResponse.json({ summary: data.summary, updated_at: data.updated_at });
        }

        const { data: milestoneRows, error: milestoneError } = await supabase
            .from(MEMORY_TABLE).select("milestone").order("milestone", { ascending: true });
        if (milestoneError) throw new Error(`Gagal load milestones: ${milestoneError.message}`);

        const totalMilestones = milestoneRows?.length || 0;
        const totalPossibleMeta = Math.floor(totalMilestones / MILESTONES_PER_META);

        const { data: metaRows, error: metaError } = await supabase
            .from(META_TABLE).select("meta_number, milestone_range, updated_at").order("meta_number", { ascending: true });
        if (metaError) throw new Error(`Gagal load meta-milestone: ${metaError.message}`);

        const metaMap = new Map<number, { milestone_range: string; updated_at: string }>();
        for (const row of metaRows || []) {
            metaMap.set(row.meta_number, { milestone_range: row.milestone_range, updated_at: row.updated_at });
        }

        const metas = [];
        for (let i = 0; i < totalPossibleMeta; i++) {
            const metaNum = i + 1;
            const milestoneStart = (i * MILESTONES_PER_META) + 1;
            const milestoneEnd = milestoneStart + MILESTONES_PER_META - 1;
            const existing = metaMap.get(metaNum);
            metas.push({
                meta_number: metaNum,
                milestone_start: milestoneStart,
                milestone_end: milestoneEnd,
                milestone_range: `${milestoneStart}-${milestoneEnd}`,
                status: existing ? "done" : "pending",
                updated_at: existing?.updated_at || null,
            });
        }

        const coveredByMeta = totalPossibleMeta * MILESTONES_PER_META;
        const orphanCount = totalMilestones - coveredByMeta;

        return NextResponse.json({
            totalMilestones,
            totalPossibleMeta,
            orphanCount,
            orphanRange: orphanCount > 0 ? `${coveredByMeta + 1}-${totalMilestones}` : null,
            metas,
            hasPending: metas.some(m => m.status === "pending"),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — Generate/regenerate satu meta-milestone
export async function POST(req: NextRequest) {
    try {
        const { meta_number } = await req.json();
        if (!meta_number || typeof meta_number !== "number" || meta_number < 1) {
            return NextResponse.json({ error: "Parameter 'meta_number' harus berupa angka >= 1" }, { status: 400 });
        }

        const milestoneStart = ((meta_number - 1) * MILESTONES_PER_META) + 1;
        const milestoneEnd = milestoneStart + MILESTONES_PER_META - 1;
        const milestoneRange = `${milestoneStart}-${milestoneEnd}`;

        const { data: milestoneData, error: milestoneError } = await supabase
            .from(MEMORY_TABLE).select("milestone, summary")
            .gte("milestone", milestoneStart).lte("milestone", milestoneEnd)
            .order("milestone", { ascending: true });

        if (milestoneError) throw new Error(`Gagal load milestones: ${milestoneError.message}`);
        if (!milestoneData || milestoneData.length === 0) {
            return NextResponse.json({ error: `Milestone ${milestoneRange} tidak ditemukan.` }, { status: 404 });
        }
        if (milestoneData.length < MILESTONES_PER_META) {
            return NextResponse.json({
                error: `Hanya ditemukan ${milestoneData.length} dari ${MILESTONES_PER_META} milestone yang dibutuhkan.`
            }, { status: 400 });
        }

        const combinedSummaries = milestoneData.map(m => `[Milestone #${m.milestone}]\n${m.summary}`).join("\n\n---\n\n");

        const prompt = `Kamu adalah Natasha, AI Social Media Strategist yang mengenal Aslam secara personal. Berikut adalah ${MILESTONES_PER_META} ringkasan milestone percakapan yang sudah lalu (milestone ${milestoneRange}).

Tugasmu adalah MERANGKUM kelima ringkasan ini menjadi SATU meta-ringkasan yang lebih padat. Meta-ringkasan ini akan disimpan sebagai memori jangka panjang yang kamu baca sebelum merespons.

Fokus pada:
- Strategi konten yang sudah dibahas dan disepakati
- Informasi kompetitor dan hasil ATM yang penting
- Keputusan-keputusan kunci terkait konten Dezebian
- Hal-hal penting yang perlu diingat jangka panjang

Tulis dalam bahasa Indonesia yang natural. JANGAN pakai format poin-poin — tulis narasi mengalir. Buat sepadat mungkin.

RINGKASAN MILESTONE:
${combinedSummaries}`;

        let result: any = null;
        let attempts = 0;

        while (attempts < apiKeys.length) {
            const apiKey = apiKeys[currentKeyIndex];
            const client = new GoogleGenAI({ apiKey });
            try {
                result = await client.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                });
                break;
            } catch (err: any) {
                if (isApiKeyError(err)) { rotateKey(); attempts++; continue; }
                throw err;
            }
        }

        if (!result) throw new Error("Semua API key gagal.");
        const summary = result.text || "";
        if (!summary) throw new Error("Gemini tidak menghasilkan summary.");

        await supabase.from(META_TABLE).delete().eq("meta_number", meta_number);
        const { error: insertError } = await supabase.from(META_TABLE).insert({
            meta_number,
            milestone_range: milestoneRange,
            milestone_end: milestoneEnd,
            summary,
            updated_at: new Date().toISOString(),
        });

        if (insertError) throw new Error(`Gagal simpan meta-milestone: ${insertError.message}`);
        return NextResponse.json({ success: true, meta_number, milestone_range: milestoneRange, summaryLength: summary.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
