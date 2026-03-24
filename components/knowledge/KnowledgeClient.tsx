"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Eye, Edit, Trash2, Search, X, FileText, Copy, Check, Pin, ChevronUp, ChevronDown } from "lucide-react";
import { KnowledgeDrawer } from "./KnowledgeDrawer";

interface KnowledgeItem {
    id: string;
    title: string;
    context: string;
    pinned?: boolean;
    created_at: string;
    updated_at?: string;
}

export default function KnowledgeClient({ initialData }: { initialData: KnowledgeItem[] }) {
    const [data, setData] = useState(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
    const [copied, setCopied] = useState(false);
    const [popupSearch, setPopupSearch] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [matchCount, setMatchCount] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const matchIndexRef = useRef(0);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState<{ id?: string; title: string; context: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus dokumen ini?")) return;
        const { error } = await supabase.from("list-rag").delete().eq("id", id);
        if (error) alert("Gagal menghapus: " + error.message);
        else setData(prev => prev.filter(item => item.id !== id));
    };

    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        const { error } = await supabase.from("list-rag").update({ pinned: !currentPinned }).eq("id", id);
        if (error) { alert("Gagal mengubah pin: " + error.message); return; }
        setData(prev => prev.map(item => item.id === id ? { ...item, pinned: !currentPinned } : item));
    };

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { alert("Gagal menyalin."); }
    };

    const handleOpenDrawer = (item?: KnowledgeItem) => {
        setDrawerData(item ? { id: item.id, title: item.title, context: item.context } : null);
        setIsDrawerOpen(true);
    };

    const handleDrawerSubmit = async (formData: { id?: string; title: string; context: string }) => {
        setIsSubmitting(true);
        try {
            if (formData.id) {
                const { data: updated, error } = await supabase.from("list-rag")
                    .update({ title: formData.title, context: formData.context })
                    .eq("id", formData.id).select().single();
                if (error) throw error;
                if (updated) setData(prev => [updated, ...prev.filter(i => i.id !== formData.id)]);
            } else {
                const { data: newItem, error } = await supabase.from("list-rag")
                    .insert([{ title: formData.title, context: formData.context }]).select().single();
                if (error) throw error;
                if (newItem) setData(prev => [newItem, ...prev]);
            }
            setIsDrawerOpen(false);
        } catch (error: any) {
            alert("Gagal menyimpan: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredData = data
        .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime();
        });

    const highlightText = useCallback((text: string, query: string, keyPrefix: string) => {
        if (!query.trim()) return <>{text}</>;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
        return <>{parts.map((p, i) => {
            if (p.toLowerCase() === query.toLowerCase()) {
                const idx = matchIndexRef.current++;
                return (
                    <mark key={`${keyPrefix}-hl${i}`} data-match-index={idx}
                        className="bg-yellow-400/40 text-white rounded-sm px-0.5">
                        {p}
                    </mark>
                );
            }
            return <span key={`${keyPrefix}-p${i}`}>{p}</span>;
        })}</>;
    }, []);

    const renderInline = (text: string, keyPrefix: string, query: string = "") => {
        const parts = text.split(/(https?:\/\/[^\s<>"')]+|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (/^https?:\/\//.test(part)) return (
                <a key={`${keyPrefix}-url${i}`} href={part} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline break-all" onClick={e => e.stopPropagation()}>
                    {highlightText(part, query, `${keyPrefix}-url${i}`)}
                </a>
            );
            if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={`${keyPrefix}-b${i}`} className="text-white font-semibold">{highlightText(part.slice(2, -2), query, `${keyPrefix}-b${i}`)}</strong>;
            if (part.startsWith('*') && part.endsWith('*'))
                return <em key={`${keyPrefix}-i${i}`} className="italic text-gray-200">{highlightText(part.slice(1, -1), query, `${keyPrefix}-i${i}`)}</em>;
            return <span key={`${keyPrefix}-t${i}`}>{highlightText(part, query, `${keyPrefix}-t${i}`)}</span>;
        });
    };

    const renderLine = (line: string, lineKey: string, query: string = "") => {
        const h1Match = line.match(/^#\s+(.*)/);
        const h2Match = line.match(/^##\s+(.*)/);
        const h3Match = line.match(/^###\s+(.*)/);
        if (h3Match) return <h3 key={lineKey} className="text-zinc-200 text-sm font-semibold mt-3 mb-1 uppercase tracking-wide">{renderInline(h3Match[1], lineKey, query)}</h3>;
        if (h2Match) return <h2 key={lineKey} className="text-white text-base font-bold mt-4 mb-1.5">{renderInline(h2Match[1], lineKey, query)}</h2>;
        if (h1Match) return <h1 key={lineKey} className="text-white text-xl font-bold mt-5 mb-2">{renderInline(h1Match[1], lineKey, query)}</h1>;
        const listMatch = line.match(/^-\s+(.*)/);
        if (listMatch) return (
            <div key={lineKey} className="flex items-start gap-2 pl-4 leading-relaxed">
                <span className="text-gray-500 mt-[3px] shrink-0">•</span>
                <p className="text-gray-300 text-[13.5px] leading-relaxed">{renderInline(listMatch[1], lineKey, query)}</p>
            </div>
        );
        if (line.trim() === '') return <div key={lineKey} className="h-2" />;
        return <p key={lineKey} className="text-gray-300 text-[13.5px] leading-relaxed">{renderInline(line, lineKey, query)}</p>;
    };

    const renderContext = (text: string, query: string = "") => {
        const sections = text.split(/\n?---\n?/);
        return sections.map((section, si) => {
            const lines = section.split('\n');
            return (
                <div key={si}>
                    {si > 0 && (
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-gray-700" />
                            <span className="text-gray-600 text-xs font-mono">---</span>
                            <div className="flex-1 h-px bg-gray-700" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        {lines.map((line, li) => renderLine(line, `s${si}-l${li}`, query))}
                    </div>
                </div>
            );
        });
    };

    useEffect(() => {
        if (!popupSearch.trim() || !selectedItem) { setMatchCount(0); setCurrentMatchIndex(0); return; }
        const timer = setTimeout(() => {
            const marks = contentRef.current?.querySelectorAll('[data-match-index]');
            const count = marks?.length ?? 0;
            setMatchCount(count);
            setCurrentMatchIndex(count > 0 ? 1 : 0);
            if (marks && marks.length > 0) (marks[0] as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 50);
        return () => clearTimeout(timer);
    }, [popupSearch, selectedItem]);

    const scrollToMatch = (idx: number) => {
        const marks = contentRef.current?.querySelectorAll('[data-match-index]');
        if (!marks || marks.length === 0) return;
        (marks[idx - 1] as HTMLElement)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    const goNext = () => { const next = currentMatchIndex >= matchCount ? 1 : currentMatchIndex + 1; setCurrentMatchIndex(next); scrollToMatch(next); };
    const goPrev = () => { const prev = currentMatchIndex <= 1 ? matchCount : currentMatchIndex - 1; setCurrentMatchIndex(prev); scrollToMatch(prev); };

    matchIndexRef.current = 0;

    return (
        <div className="h-full overflow-auto p-6 md:p-8">
            <div className="flex flex-row justify-between items-center mb-8 gap-3">
                <p className="text-white text-2xl font-bold">Knowledge Base</p>
                <button onClick={() => handleOpenDrawer()}
                    className="text-sm font-bold bg-dz-primary hover:bg-[#007042] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg cursor-pointer whitespace-nowrap">
                    Tambah Dokumen
                </button>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="Cari judul dokumen..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#27272a] bg-[#121212] focus:outline-none focus:ring-1 focus:ring-dz-primary text-white placeholder:text-zinc-600 transition-colors"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredData.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Belum ada dokumen. Tambahkan referensi untuk Natasha!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredData.map(item => (
                        <div key={item.id}
                            className={`bg-[#141414] border rounded-xl flex flex-col transition-colors ${item.pinned ? 'border-dz-primary/40' : 'border-[#27272a]'}`}>
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold text-[15px] text-white leading-snug">{item.title}</p>
                                    {item.pinned && (
                                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-dz-primary bg-dz-primary/10 border border-dz-primary/20 px-2 py-0.5 rounded-full mt-0.5">
                                            <Pin size={9} />Pinned
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{item.context?.slice(0, 120)}</p>
                            </div>
                            <div className="p-4 border-t border-[#27272a] flex justify-between items-center bg-[#111] rounded-b-xl">
                                <span className="text-xs text-zinc-600">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleTogglePin(item.id, item.pinned ?? false)}
                                        className={`p-2 cursor-pointer transition-colors ${item.pinned ? 'text-dz-primary' : 'text-zinc-500 hover:text-white'}`}>
                                        <Pin size={15} />
                                    </button>
                                    <button onClick={() => setSelectedItem(item)} className="p-2 text-zinc-500 hover:text-white cursor-pointer"><Eye size={15} /></button>
                                    <button onClick={() => handleOpenDrawer(item)} className="p-2 text-zinc-500 hover:text-white cursor-pointer"><Edit size={15} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash2 size={15} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => { setSelectedItem(null); setPopupSearch(""); }}>
                    <div className="bg-[#141414] border border-[#27272a] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-[#27272a] flex justify-between items-center bg-[#1A1A1A]">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="text-zinc-400 shrink-0" size={18} />
                                <h2 className="text-base font-bold text-white truncate">{selectedItem.title}</h2>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                <button onClick={() => handleCopy(selectedItem.context)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${copied ? 'bg-dz-primary/20 text-dz-primary border border-dz-primary/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-[#27272a]'}`}>
                                    {copied ? <Check size={12} /> : <Copy size={12} />}
                                    {copied ? 'Tersalin!' : 'Salin'}
                                </button>
                                <button onClick={() => { setSelectedItem(null); setPopupSearch(""); }}
                                    className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-3 border-b border-[#27272a] bg-[#111]">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                    <input type="text" placeholder="Cari teks dalam dokumen..."
                                        className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#27272a] bg-[#0e0e0e] focus:outline-none focus:ring-1 focus:ring-dz-primary text-white text-sm placeholder:text-zinc-500"
                                        value={popupSearch} onChange={e => setPopupSearch(e.target.value)} autoFocus />
                                    {popupSearch && <button onClick={() => { setPopupSearch(""); setMatchCount(0); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X size={12} /></button>}
                                </div>
                                {popupSearch.trim() && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-xs text-zinc-400 min-w-[52px] text-center">{matchCount === 0 ? '0 / 0' : `${currentMatchIndex} / ${matchCount}`}</span>
                                        <button onClick={goPrev} disabled={matchCount === 0} className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronUp size={14} /></button>
                                        <button onClick={goNext} disabled={matchCount === 0} className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronDown size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div ref={contentRef} className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                            {renderContext(selectedItem.context, popupSearch)}
                        </div>

                        <div className="px-6 py-3 border-t border-[#27272a] flex justify-end bg-[#1A1A1A]">
                            <button onClick={() => { setSelectedItem(null); setPopupSearch(""); }}
                                className="px-5 py-2 bg-transparent border border-[#27272a] hover:bg-[#2c2c2e] text-zinc-300 text-sm rounded-lg transition-colors cursor-pointer">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <KnowledgeDrawer
                isOpen={isDrawerOpen}
                initialData={drawerData}
                isSubmitting={isSubmitting}
                onClose={() => setIsDrawerOpen(false)}
                onSubmit={handleDrawerSubmit}
            />
        </div>
    );
}
