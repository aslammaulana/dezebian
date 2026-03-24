// app/api/chat/regenerate-memory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { currentKeyIndex, rotateKey } from "@/lib/geminiKeyState";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHAT_TABLE = "natasha_chat";
const MEMORY_TABLE = "natasha_memory";
const CHUNK_SIZE = 15;

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
        err?.status === 429 || err?.status === 401 || err?.status === 403 ||
        message.includes("quota") || message.includes("key")
    );
}

function buildPrompt(chunk: { role: string; text: string }[]): string {
    const historyText = chunk
        .map(m => `${m.role === "user" ? "User" : "Natasha"}: ${m.text}`)
        .join("\n");

    return `Kamu adalah Natasha, AI Social Media Strategist yang mengenal Aslam secara personal. Baca riwayat percakapan berikut dan tulis ringkasan memori dalam bentuk beberapa paragraf naratif — bukan poin-poin.

Ringkasan ini akan kamu gunakan untuk mengingat apa yang telah kalian bicarakan terkait strategi konten, kompetitor, ATM, dan hal-hal penting lainnya.

Tulis seperti cerita singkat yang mencakup: topik yang dibahas, keputusan yang diambil, strategi yang disepakati, dan hal penting yang perlu diingat. Gunakan bahasa Indonesia yang natural.

RIWAYAT:\n${historyText}`;
}

export async function POST(req: NextRequest) {
    try {
        const { milestone } = await req.json();
        if (!milestone || typeof milestone !== "number" || milestone < 1) {
            return NextResponse.json({ error: "Parameter 'milestone' harus berupa angka >= 1" }, { status: 400 });
        }

        let lastCoveredId = 0;
        if (milestone > 1) {
            const { data: prevMemory, error: prevError } = await supabase
                .from(MEMORY_TABLE)
                .select("chat_id_end")
                .eq("milestone", milestone - 1)
                .maybeSingle();

            if (prevError) throw new Error(`Gagal load milestone sebelumnya: ${prevError.message}`);
            if (!prevMemory || prevMemory.chat_id_end == null) {
                return NextResponse.json({
                    error: `Milestone ${milestone - 1} belum di-generate. Generate berurutan dari milestone terkecil.`
                }, { status: 400 });
            }
            lastCoveredId = prevMemory.chat_id_end;
        }

        const { data: chatRows, error: chatError } = await supabase
            .from(CHAT_TABLE)
            .select("id, role, text")
            .neq("role", "system")
            .gt("id", lastCoveredId)
            .order("id", { ascending: true })
            .limit(CHUNK_SIZE);

        if (chatError) throw new Error(`Gagal load chat: ${chatError.message}`);
        if (!chatRows || chatRows.length === 0) throw new Error("Tidak ada chat baru setelah milestone sebelumnya.");
        if (chatRows.length < CHUNK_SIZE) {
            return NextResponse.json({
                error: `Hanya ada ${chatRows.length} chat baru (butuh ${CHUNK_SIZE}). Tambah chat dulu.`
            }, { status: 400 });
        }

        const chatIdStart = chatRows[0].id;
        const chatIdEnd = chatRows[chatRows.length - 1].id;
        const prompt = buildPrompt(chatRows);

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

        await supabase.from(MEMORY_TABLE).delete().eq("milestone", milestone);
        const { error: insertError } = await supabase.from(MEMORY_TABLE).insert({
            summary,
            milestone,
            chat_id_start: chatIdStart,
            chat_id_end: chatIdEnd,
            updated_at: new Date().toISOString(),
        });

        if (insertError) throw new Error(`Gagal simpan memory: ${insertError.message}`);
        return NextResponse.json({ success: true, milestone, idRange: `${chatIdStart}-${chatIdEnd}`, summaryLength: summary.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
