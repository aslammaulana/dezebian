// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getInstruction, parseJsonResponse, extractMode } from "./instruction";
import { Role, Message, UploadedFile } from "@/types/chat";
import { currentKeyIndex, rotateKey } from "@/lib/geminiKeyState";
import { cleanupOldChats } from "@/lib/chatCleanup";

// =================================================================
// SUPABASE SETUP
// =================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL atau SUPABASE_ANON_KEY hilang.");
}

const supabase: SupabaseClient = createClient(
    supabaseUrl || "dummy-url",
    supabaseKey || "dummy-key"
);

const CHAT_TABLE = "natasha_chat";
const KNOWLEDGE_TABLE = "list-rag";
const META_MILESTONE_TABLE = "natasha_meta_milestone";

// -----------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------

async function loadHistory(): Promise<Message[]> {
    const { data: dbData, error: dbError } = await supabase
        .from(CHAT_TABLE)
        .select("id, role, text, created_at")
        .neq("role", "system")
        .order("id", { ascending: false })
        .limit(20);

    if (dbError) {
        console.error("[HISTORY]", `Supabase fetch error: ${dbError.message}`);
    }

    const supabaseHistory: Message[] = (dbData || []).reverse().map(item => ({
        id: Number(item.id),
        role: item.role as Role,
        text: item.text,
        content: item.text,
        timestamp: new Date(item.created_at).getTime(),
        created_at: item.created_at,
    }));

    return supabaseHistory;
}

async function saveMessages(messages: { role: string; text: string }[]): Promise<void> {
    const { error } = await supabase.from(CHAT_TABLE).insert(messages);
    if (error) throw new Error(error.message);
}

// =================================================================
// CONVERSATIONAL MEMORY HELPERS
// =================================================================
const MEMORY_TABLE = "natasha_memory";

async function loadMetaMilestones(): Promise<{ text: string; lastMilestoneEnd: number }> {
    const { data } = await supabase
        .from(META_MILESTONE_TABLE)
        .select("meta_number, milestone_range, milestone_end, summary")
        .order("meta_number", { ascending: true });
    if (!data || data.length === 0) return { text: "", lastMilestoneEnd: 0 };
    const lastMilestoneEnd = data[data.length - 1].milestone_end || 0;
    const text = data
        .map(row => `[Meta-Memori #${row.meta_number} | Milestone ${row.milestone_range}]\n${row.summary}`)
        .join("\n\n");
    return { text, lastMilestoneEnd };
}

async function loadMemory(lastMetaMilestoneEnd: number): Promise<string> {
    const query = supabase
        .from(MEMORY_TABLE)
        .select("summary, milestone")
        .order("milestone", { ascending: true });

    if (lastMetaMilestoneEnd > 0) {
        query.gt("milestone", lastMetaMilestoneEnd);
    }

    const { data } = await query;
    if (!data || data.length === 0) return "";
    return data
        .map((row) => `[Memori #${row.milestone}]\n${row.summary}`)
        .join("\n\n");
}

// =================================================================
// MULTI API KEY SETUP
// =================================================================
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
        err?.status === 503 ||
        message.includes("quota") || message.includes("key") ||
        message.includes("unavailable") || message.includes("overloaded")
    );
}

function formatRAGContext(contextFiles: UploadedFile[]): string {
    if (!contextFiles.length) return "";
    return "\n--- DOKUMEN REFERENSI ---\n" + contextFiles
        .map(f => `JUDUL: ${f.name}\nISI: ${f.content}`)
        .join("\n\n") + "\n--- AKHIR REFERENSI ---\n";
}

function resolveMessageTime(msg: Message): Date {
    if (msg.created_at) return new Date(msg.created_at);
    if (msg.timestamp) return new Date(msg.timestamp);
    return new Date();
}

function buildTimeGapInstruction(history: Message[]): string {
    if (history.length === 0) return "";
    const lastMsg = history[history.length - 1];
    const lastTime = resolveMessageTime(lastMsg);
    const now = new Date();
    const diffMs = now.getTime() - lastTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const lastTimeStr = lastTime.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const nowStr = now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    let gapLabel: string;
    if (diffHours < 1) gapLabel = `${Math.round(diffHours * 60)} menit`;
    else if (diffHours < 24) gapLabel = `${Math.round(diffHours)} jam`;
    else gapLabel = `${Math.round(diffDays)} hari`;

    let rule: string;
    if (diffHours < 1) {
        rule = "Selisih waktu sangat pendek. Boleh langsung lanjut dari konteks percakapan terakhir secara natural.";
    } else if (diffHours < 4) {
        rule = "Selisih waktu cukup pendek. Boleh singgung topik terakhir secara ringan.";
    } else if (diffHours < 24) {
        rule = "Selisih waktu cukup lama (lebih dari 4 jam). Sapa secara umum tanpa langsung mengasumsikan konteks terakhir masih relevan.";
    } else if (diffDays < 3) {
        rule = "Sudah lebih dari 1 hari sejak chat terakhir. Perlakukan sebagai sesi baru.";
    } else {
        rule = "Sudah lebih dari 3 hari sejak chat terakhir. Sesi completely baru.";
    }

    return [
        `--- KESADARAN WAKTU (WAJIB DIPATUHI) ---`,
        `Pesan terakhir dikirim pada: ${lastTimeStr}`,
        `Waktu sekarang: ${nowStr}`,
        `Selisih waktu aktual: ${gapLabel}`,
        `ATURAN WAKTU: ${rule}`,
    ].join("\n");
}

// =================================================================
// MAIN POST HANDLER
// =================================================================

export async function POST(req: NextRequest) {
    try {
        const {
            newMessage,
            selectedDocumentIds,
            useWebSearch,
            useHighThinking = false,
        } = await req.json();

        const { mode: personaMode, cleanMessage: finalNewMessage } = extractMode(newMessage);
        console.log("[REQUEST]", `Pesan diterima. Persona: ${personaMode}, WebSearch: ${useWebSearch}, Docs: ${selectedDocumentIds?.length || 0}`);

        const [history, metaResult, selectedRagData] = await Promise.all([
            loadHistory(),
            loadMetaMilestones(),
            selectedDocumentIds && selectedDocumentIds.length > 0
                ? supabase.from(KNOWLEDGE_TABLE).select("id, title, context").in("id", selectedDocumentIds)
                : Promise.resolve({ data: null }),
        ]);

        const memorySummary = await loadMemory(metaResult.lastMilestoneEnd);
        const metaSummary = metaResult.text;

        let contextFiles: UploadedFile[] = [];
        if (selectedRagData.data) {
            contextFiles.push(...(selectedRagData.data as any[]).map(item => ({
                id: item.id,
                name: item.title,
                content: item.context || "",
                size: item.context ? item.context.length : 0,
                type: "text/plain",
            })));
        }

        console.log("[RAG]", `Context files: ${contextFiles.map(f => f.name).join(", ") || "none"} | History: ${history.length} msgs`);

        const modelId = useWebSearch ? "gemini-2.5-flash" : "gemini-2.5-flash";

        const config: any = { temperature: 0.5 };
        if (!useWebSearch) {
            config.thinkingConfig = {
                thinkingLevel: useHighThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW
            };
        }
        if (useWebSearch) config.tools = [{ googleSearch: {} }];

        const instruction = getInstruction(personaMode).instruction;
        const systemMessages = history
            .filter(msg => msg.role === Role.SYSTEM)
            .map(msg => msg.content || msg.text)
            .join("\n\n");

        const last20History = history
            .filter(msg => msg.role !== Role.SYSTEM)
            .slice(-20);

        const timeText = `Waktu server: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;
        const contextBlock = formatRAGContext(contextFiles);
        const timeGapBlock = buildTimeGapInstruction(history);
        const metaBlock = metaSummary
            ? `--- INGATAN JANGKA PANJANG (META-MILESTONE) ---\n${metaSummary}`
            : "";
        const memoryBlock = memorySummary
            ? `--- INGATAN JANGKA MENENGAH (MILESTONE TERKINI) ---\n${memorySummary}`
            : "";

        const webSearchStatus = useWebSearch
            ? `--- STATUS FITUR ---\nWEB SEARCH: AKTIF ✅`
            : `--- STATUS FITUR ---\nWEB SEARCH: TIDAK AKTIF ❌ — Jangan menjawab seolah-olah kamu tahu informasi real-time.`;

        const OVERLOAD_THRESHOLD_KB = 150;
        const estimatedKB = (
            Buffer.byteLength(instruction, 'utf8') +
            Buffer.byteLength(metaBlock, 'utf8') +
            Buffer.byteLength(memoryBlock, 'utf8') +
            Buffer.byteLength(contextBlock, 'utf8') +
            last20History.reduce((sum, m) => sum + Buffer.byteLength((m.content ?? m.text ?? ''), 'utf8'), 0)
        ) / 1024;

        const overloadWarning = estimatedKB > OVERLOAD_THRESHOLD_KB
            ? `--- ⚠️ PERINGATAN SISTEM ---\nKonteks mencapai ${estimatedKB.toFixed(1)} KB — melebihi batas optimal. Sampaikan ke user secara natural untuk membuat milestone baru.`
            : "";

        const finalUserPrompt = [
            `--- ROLE/INSTRUCTION ---`,
            instruction,
            `--- CONTEXT ---`,
            timeText,
            webSearchStatus,
            timeGapBlock,
            overloadWarning,
            metaBlock,
            memoryBlock,
            contextBlock,
            `Pesan Pengguna: ${finalNewMessage}`
        ].filter(Boolean).join("\n\n");

        const contents = last20History.map(msg => {
            const msgTime = resolveMessageTime(msg).toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
            const textWithTimestamp = `[${msgTime}] ${(msg.content ?? msg.text ?? '').trim()}`;
            return {
                role: msg.role === Role.USER ? "user" : "model",
                parts: [{ text: textWithTimestamp }]
            };
        });

        contents.push({
            role: "user",
            parts: [{ text: (systemMessages ? `--- SYSTEM MEMORY ---\n${systemMessages}\n\n` : "") + finalUserPrompt }]
        });

        // EXECUTE GEMINI — with key rotation
        let geminiResult: any = null;
        let groundingMetadata: any = null;
        let attempts = 0;
        let usedKeyIndex = currentKeyIndex;
        const geminiStart = Date.now();

        while (attempts < apiKeys.length) {
            const apiKey = apiKeys[currentKeyIndex];
            const client = new GoogleGenAI({ apiKey });

            try {
                console.log("[GEMINI]", `Mengirim ke Gemini... (API Key: K-${currentKeyIndex}, model: ${modelId})`);
                geminiResult = await client.models.generateContent({
                    model: modelId,
                    contents,
                    config,
                });
                usedKeyIndex = currentKeyIndex;
                console.log("[GEMINI]", `Respons diterima dalam ${Date.now() - geminiStart}ms.`);
                break;
            } catch (err: any) {
                if (isApiKeyError(err)) {
                    console.warn("[API_KEY]", `K-${currentKeyIndex} gagal. Rotasi ke key berikutnya.`);
                    rotateKey();
                    attempts++;
                    continue;
                }
                throw err;
            }
        }

        if (!geminiResult) {
            return NextResponse.json({
                text: "Waduh, semua quota API lagi penuh nih 😅 Coba lagi sebentar ya.",
                groundingMetadata: null,
                activeKey: `K-${currentKeyIndex}`,
            });
        }

        const fullText = geminiResult.text || "";
        groundingMetadata = geminiResult.candidates?.[0]?.groundingMetadata || null;

        const parsed = parseJsonResponse(fullText);
        if (fullText) {
            const userMessage = { role: Role.USER, text: newMessage };
            const assistantMessage = { role: Role.MODEL, text: parsed.text };

            saveMessages([userMessage, assistantMessage])
                .then(() => cleanupOldChats(supabase))
                .catch((saveErr) => {
                    console.error("[SAVE]", `Gagal simpan/cleanup: ${saveErr.message}`);
                });
        }

        return NextResponse.json({
            text: parsed.text,
            groundingMetadata,
            activeKey: `K-${usedKeyIndex}`,
        });

    } catch (err: any) {
        console.error("[SERVER]", `Fatal: ${err.message}`);
        return NextResponse.json(
            { error: "Internal Server Error", details: err.message },
            { status: 500 }
        );
    }
}
