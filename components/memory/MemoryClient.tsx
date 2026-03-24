"use client";

import { useState, useEffect } from "react";
import { Brain, RefreshCw, Check, Clock, ChevronDown, ChevronUp, AlertCircle, Loader2, Layers } from "lucide-react";

interface Milestone {
    milestone: number;
    status: "done" | "pending";
    idRange: string;
    idStart: number;
    idEnd: number;
    updated_at: string | null;
}

interface MemoryStatusResponse {
    totalChats: number;
    totalMilestones: number;
    remainingChats: number;
    milestones: Milestone[];
}

interface MetaMilestone {
    meta_number: number;
    milestone_start: number;
    milestone_end: number;
    milestone_range: string;
    status: "done" | "pending";
    updated_at: string | null;
}

interface MetaStatusResponse {
    totalMilestones: number;
    totalPossibleMeta: number;
    orphanCount: number;
    orphanRange: string | null;
    metas: MetaMilestone[];
    hasPending: boolean;
}

interface SummaryCache {
    summary: string;
    updated_at: string | null;
}

export default function MemoryClient() {
    const [data, setData] = useState<MemoryStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [regeneratingMilestone, setRegeneratingMilestone] = useState<number | null>(null);
    const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
    const [summaryCache, setSummaryCache] = useState<Map<number, SummaryCache>>(new Map());
    const [loadingSummary, setLoadingSummary] = useState<number | null>(null);
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);
    const [autoGenerateProgress, setAutoGenerateProgress] = useState<{ current: number; total: number } | null>(null);

    const [metaData, setMetaData] = useState<MetaStatusResponse | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);
    const [generatingMeta, setGeneratingMeta] = useState<number | null>(null);
    const [expandedMeta, setExpandedMeta] = useState<number | null>(null);
    const [metaSummaryCache, setMetaSummaryCache] = useState<Map<number, string>>(new Map());
    const [loadingMetaSummary, setLoadingMetaSummary] = useState<number | null>(null);
    const [isAutoGeneratingMeta, setIsAutoGeneratingMeta] = useState(false);
    const [autoGenerateMetaProgress, setAutoGenerateMetaProgress] = useState<{ current: number; total: number } | null>(null);

    const [activeTab, setActiveTab] = useState<"milestone" | "meta">("meta");

    const fetchStatus = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch("/api/chat/memory-status");
            if (!res.ok) throw new Error("Gagal memuat status memory");
            setData(await res.json());
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const fetchMetaStatus = async () => {
        setMetaLoading(true); setMetaError(null);
        try {
            const res = await fetch("/api/meta-milestone");
            if (!res.ok) throw new Error("Gagal memuat status meta-milestone");
            setMetaData(await res.json());
        } catch (err: any) { setMetaError(err.message); }
        finally { setMetaLoading(false); }
    };

    useEffect(() => { fetchStatus(); fetchMetaStatus(); }, []);

    const fetchSummary = async (milestoneNum: number) => {
        if (summaryCache.has(milestoneNum)) return;
        setLoadingSummary(milestoneNum);
        try {
            const res = await fetch(`/api/chat/memory-status?milestone=${milestoneNum}`);
            if (!res.ok) throw new Error("Gagal memuat ringkasan");
            const json = await res.json();
            setSummaryCache(prev => { const next = new Map(prev); next.set(milestoneNum, { summary: json.summary, updated_at: json.updated_at }); return next; });
        } catch (err: any) { setError(err.message); }
        finally { setLoadingSummary(null); }
    };

    const handleRegenerate = async (milestone: number) => {
        setRegeneratingMilestone(milestone);
        try {
            const res = await fetch("/api/chat/regenerate-memory", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ milestone }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Gagal regenerate"); }
            setSummaryCache(prev => { const next = new Map(prev); next.delete(milestone); return next; });
            await fetchStatus();
        } catch (err: any) { setError(err.message); }
        finally { setRegeneratingMilestone(null); }
    };

    const toggleExpand = async (milestone: number) => {
        if (expandedMilestone === milestone) { setExpandedMilestone(null); return; }
        setExpandedMilestone(milestone);
        await fetchSummary(milestone);
    };

    const handleAutoGenerate = async () => {
        if (!data || isAutoGenerating) return;
        const pending = data.milestones.filter(m => m.status === "pending");
        if (pending.length === 0) return;
        setIsAutoGenerating(true);
        setAutoGenerateProgress({ current: 0, total: pending.length });
        for (let i = 0; i < pending.length; i++) {
            setAutoGenerateProgress({ current: i + 1, total: pending.length });
            await handleRegenerate(pending[i].milestone);
            if (i < pending.length - 1) await new Promise(r => setTimeout(r, 10000));
        }
        setIsAutoGenerating(false);
        setAutoGenerateProgress(null);
    };

    const handleGenerateMeta = async (meta_number: number) => {
        setGeneratingMeta(meta_number); setMetaError(null);
        try {
            const res = await fetch("/api/meta-milestone", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meta_number }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Gagal generate meta-milestone"); }
            setMetaSummaryCache(prev => { const next = new Map(prev); next.delete(meta_number); return next; });
            await fetchMetaStatus();
        } catch (err: any) { setMetaError(err.message); }
        finally { setGeneratingMeta(null); }
    };

    const handleAutoGenerateMeta = async () => {
        if (!metaData || isAutoGeneratingMeta) return;
        const pending = metaData.metas.filter(m => m.status === "pending");
        if (pending.length === 0) return;
        setIsAutoGeneratingMeta(true);
        setAutoGenerateMetaProgress({ current: 0, total: pending.length });
        for (let i = 0; i < pending.length; i++) {
            setAutoGenerateMetaProgress({ current: i + 1, total: pending.length });
            await handleGenerateMeta(pending[i].meta_number);
            if (i < pending.length - 1) await new Promise(r => setTimeout(r, 10000));
        }
        setIsAutoGeneratingMeta(false);
        setAutoGenerateMetaProgress(null);
    };

    const toggleExpandMeta = async (meta_number: number) => {
        if (expandedMeta === meta_number) { setExpandedMeta(null); return; }
        setExpandedMeta(meta_number);
        if (!metaSummaryCache.has(meta_number)) {
            setLoadingMetaSummary(meta_number);
            try {
                const res = await fetch(`/api/meta-milestone?meta_number=${meta_number}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.summary) setMetaSummaryCache(prev => { const next = new Map(prev); next.set(meta_number, json.summary); return next; });
                }
            } catch { }
            finally { setLoadingMetaSummary(null); }
        }
    };

    if (loading && !data && metaLoading && !metaData) {
        return (
            <div className="flex items-center justify-center h-full bg-[#141414]">
                <div className="flex items-center gap-3 text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Memuat data memory...</span>
                </div>
            </div>
        );
    }

    const cardBase = "bg-[#1a1a1a] border border-[#27272a] rounded-xl";
    const activeBtn = "bg-dz-primary text-white";
    const inactiveBtn = "text-zinc-400 hover:text-zinc-300";

    return (
        <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="max-w-3xl mx-auto px-4 py-8 md:px-6">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-dz-primary/20">
                            <Brain className="w-6 h-6 text-dz-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Memory Manager</h1>
                    </div>
                    <p className="text-zinc-400 text-sm">
                        Kelola memori Natasha: Meta-Milestone (jangka panjang) dan Milestone (jangka menengah).
                    </p>
                </div>

                {/* Stats Overview */}
                {(data || metaData) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className={`${cardBase} p-4`}>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Chat</p>
                            <p className="text-2xl font-bold text-white">{data?.totalChats ?? "—"}</p>
                        </div>
                        <div className={`${cardBase} p-4`}>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Milestones</p>
                            <p className="text-2xl font-bold text-white">{data?.totalMilestones ?? "—"}</p>
                        </div>
                        <div className="bg-[#1a1a1a] border border-dz-primary/30 rounded-xl p-4">
                            <p className="text-xs text-dz-primary/80 uppercase tracking-wide mb-1">Meta-Milestone</p>
                            <p className="text-2xl font-bold text-dz-primary">
                                {metaData ? `${metaData.metas.filter(m => m.status === "done").length}/${metaData.totalPossibleMeta}` : "—"}
                            </p>
                        </div>
                        <div className={`${cardBase} p-4`}>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Orphan</p>
                            <p className="text-2xl font-bold text-white">{metaData?.orphanCount ?? "—"}</p>
                            <p className="text-[10px] text-zinc-600">milestone belum di-meta</p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className={`flex gap-1 ${cardBase} p-1 mb-6`}>
                    {(["meta", "milestone"] as const).map(tab => (
                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === tab ? activeBtn : inactiveBtn}`}>
                            {tab === "meta" ? <Layers className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                            {tab === "meta" ? "Meta-Milestone" : "Milestone"}
                            {tab === "meta" && metaData?.hasPending && <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
                            {tab === "milestone" && data?.milestones.some(m => m.status === "pending") && <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {(error || metaError) && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error || metaError}</span>
                    </div>
                )}

                {/* ── TAB: META-MILESTONE ── */}
                {activeTab === "meta" && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-zinc-400">1 meta = 5 milestone · Memori jangka panjang Natasha</p>
                                {metaData?.orphanCount !== undefined && metaData.orphanCount > 0 && (
                                    <p className="text-xs text-yellow-500/80 mt-1">
                                        ⚠️ {metaData.orphanCount} milestone ({metaData.orphanRange}) belum bisa di-meta (butuh kelipatan 5)
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {metaData && metaData.metas.filter(m => m.status === "pending").length > 0 && (
                                    <button onClick={handleAutoGenerateMeta}
                                        disabled={isAutoGeneratingMeta || generatingMeta !== null}
                                        className="flex items-center gap-2 px-4 py-2 bg-dz-primary hover:bg-[#007042] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                        {isAutoGeneratingMeta ? (
                                            <><RefreshCw className="w-4 h-4 animate-spin" /><span>Generating {autoGenerateMetaProgress?.current}/{autoGenerateMetaProgress?.total}</span></>
                                        ) : (
                                            <><Layers className="w-4 h-4" /><span>Generate All Pending</span></>
                                        )}
                                    </button>
                                )}
                                <button onClick={fetchMetaStatus} disabled={metaLoading} className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 transition-colors disabled:opacity-40 cursor-pointer">
                                    <RefreshCw className={`w-4 h-4 ${metaLoading ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {metaLoading && !metaData ? (
                            <div className="flex items-center gap-3 text-zinc-400 py-8 justify-center"><Loader2 className="w-5 h-5 animate-spin" /><span>Memuat meta-milestone...</span></div>
                        ) : metaData && metaData.metas.length > 0 ? (
                            <div className="space-y-2">
                                {metaData.metas.map(meta => {
                                    const isExpanded = expandedMeta === meta.meta_number;
                                    const isGenerating = generatingMeta === meta.meta_number;
                                    const isLoadingSumm = loadingMetaSummary === meta.meta_number;
                                    const cachedSummary = metaSummaryCache.get(meta.meta_number);
                                    return (
                                        <div key={meta.meta_number} className={`${cardBase} overflow-hidden`}>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.status === "done" ? "bg-dz-primary/15 text-dz-primary" : "bg-zinc-700/50 text-zinc-500"}`}>
                                                        {meta.status === "done" ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Meta #{meta.meta_number}</p>
                                                        <p className="text-xs text-zinc-500">Milestone {meta.milestone_range}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {meta.status === "done" && (
                                                        <button onClick={() => toggleExpandMeta(meta.meta_number)} className="p-1.5 cursor-pointer rounded-lg hover:bg-zinc-700/50 text-zinc-400 transition-colors">
                                                            {isLoadingSumm ? <Loader2 className="w-4 h-4 animate-spin" /> : isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleGenerateMeta(meta.meta_number)} disabled={generatingMeta !== null}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${meta.status === "done" ? "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50" : "bg-dz-primary text-white hover:bg-[#007042]"}`}>
                                                        {isGenerating ? <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" />Generating...</span> : meta.status === "done" ? "Re-generate" : "Generate"}
                                                    </button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 border-t border-[#27272a]">
                                                    {isLoadingSumm ? (
                                                        <div className="mt-3 flex items-center gap-2 text-zinc-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /><span>Memuat...</span></div>
                                                    ) : cachedSummary ? (
                                                        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
                                                            <p className="text-xs text-zinc-500 mb-2">Meta-Ringkasan:</p>
                                                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{cachedSummary}</p>
                                                            {meta.updated_at && <p className="text-[10px] text-zinc-600 mt-2">Diperbarui: {new Date(meta.updated_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 text-sm text-zinc-500">Ringkasan tidak tersedia. Coba re-generate.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-zinc-500">
                                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Belum ada meta-milestone yang bisa dibuat.</p>
                                <p className="text-xs mt-1">Minimal butuh 5 milestone yang sudah ter-generate.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: MILESTONE ── */}
                {activeTab === "milestone" && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-zinc-400">Setiap milestone mencakup 15 pesan.</p>
                            {data && data.milestones.filter(m => m.status === "pending").length > 0 && (
                                <button onClick={handleAutoGenerate} disabled={isAutoGenerating || regeneratingMilestone !== null}
                                    className="flex items-center gap-2 px-4 py-2 bg-dz-primary hover:bg-[#007042] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer">
                                    {isAutoGenerating ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /><span>Generating {autoGenerateProgress?.current}/{autoGenerateProgress?.total}</span></>
                                    ) : (
                                        <><Brain className="w-4 h-4" /><span>Generate All Pending</span></>
                                    )}
                                </button>
                            )}
                        </div>

                        {data && (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className={`${cardBase} p-3`}>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Sisa Chat</p>
                                    <p className="text-xl font-bold text-white">{data.remainingChats}<span className="text-sm font-normal text-zinc-500"> / 15</span></p>
                                    <p className="text-[10px] text-zinc-600">belum cukup 1 milestone</p>
                                </div>
                                <div className={`${cardBase} p-3`}>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Pending</p>
                                    <p className="text-xl font-bold text-yellow-400">{data.milestones.filter(m => m.status === "pending").length}</p>
                                    <p className="text-[10px] text-zinc-600">milestone belum di-generate</p>
                                </div>
                            </div>
                        )}

                        {data && data.milestones.length > 0 ? (
                            <div className="space-y-2">
                                {data.milestones.map(m => {
                                    const cached = summaryCache.get(m.milestone);
                                    const isExpanded = expandedMilestone === m.milestone;
                                    const isLoadingSumm = loadingSummary === m.milestone;
                                    return (
                                        <div key={m.milestone} className={`${cardBase} overflow-hidden`}>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.status === "done" ? "bg-dz-primary/15 text-dz-primary" : "bg-zinc-700/50 text-zinc-500"}`}>
                                                        {m.status === "done" ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Milestone {m.milestone}</p>
                                                        <p className="text-xs text-zinc-500">Chat ID: {m.idRange}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {m.status === "done" && (
                                                        <button onClick={() => toggleExpand(m.milestone)} className="p-1.5 cursor-pointer rounded-lg hover:bg-zinc-700/50 text-zinc-400 transition-colors">
                                                            {isLoadingSumm ? <Loader2 className="w-4 h-4 animate-spin" /> : isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleRegenerate(m.milestone)} disabled={regeneratingMilestone !== null}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${m.status === "done" ? "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50" : "bg-dz-primary text-white hover:bg-[#007042]"}`}>
                                                        {regeneratingMilestone === m.milestone ? <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" />Generating...</span> : m.status === "done" ? "Re-generate" : "Generate"}
                                                    </button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 border-t border-[#27272a]">
                                                    {isLoadingSumm ? (
                                                        <div className="mt-3 flex items-center gap-2 text-zinc-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /><span>Memuat...</span></div>
                                                    ) : cached ? (
                                                        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
                                                            <p className="text-xs text-zinc-500 mb-2">Ringkasan:</p>
                                                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{cached.summary}</p>
                                                            {cached.updated_at && <p className="text-[10px] text-zinc-600 mt-2">Diperbarui: {new Date(cached.updated_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 text-sm text-zinc-500">Gagal memuat ringkasan.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : data && data.milestones.length === 0 ? (
                            <div className="text-center py-16 text-zinc-500">
                                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Belum ada milestone. Minimal 15 pesan diperlukan.</p>
                                <p className="text-xs mt-1">Saat ini ada {data.totalChats} pesan ({data.remainingChats} menuju milestone pertama).</p>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
