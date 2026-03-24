"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Globe, X, FileText, Brain, Search } from 'lucide-react';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { AvailableDocument } from '@/types/chat';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    availableDocuments: AvailableDocument[];
    selectedDocumentIds: string[];
    onToggleDocument: (id: string) => void;
    isWebSearchEnabled: boolean;
    setIsWebSearchEnabled: (enabled: boolean) => void;
    isHighThinking: boolean;
    setIsHighThinking: (enabled: boolean) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    isOpen,
    onClose,
    availableDocuments,
    selectedDocumentIds,
    onToggleDocument,
    isWebSearchEnabled,
    setIsWebSearchEnabled,
    isHighThinking,
    setIsHighThinking,
}) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [ragSearch, setRagSearch] = useState("");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div
            ref={sidebarRef}
            className={`fixed inset-y-0 right-0 z-50 w-80 bg-[#141414] border-l border-[#27272a] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col h-screen shadow-2xl`}
        >
            {/* Header */}
            <div className="h-[50px] border-b border-[#27272a] flex items-center justify-between px-4">
                <h2 className="font-semibold text-sm text-white">Chat Settings</h2>
                <button onClick={onClose} className="cursor-pointer text-zinc-500 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
                {/* Web Search Toggle */}
                <div
                    className="p-4 rounded-lg bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-between cursor-pointer hover:border-[#3a3a3a] transition-colors"
                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                            <Globe size={14} className={isWebSearchEnabled ? "text-dz-primary" : "text-gray-500"} />
                            Web Search
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5">Live Google Search</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${isWebSearchEnabled ? 'bg-dz-primary' : 'bg-gray-700'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isWebSearchEnabled ? 'translate-x-4' : ''}`} />
                    </div>
                </div>

                {/* Deep Thinking Toggle */}
                <div
                    className="p-4 rounded-lg bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-between cursor-pointer hover:border-[#3a3a3a] transition-colors"
                    onClick={() => setIsHighThinking(!isHighThinking)}
                >
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                            <Brain size={14} className={isHighThinking ? "text-amber-400" : "text-gray-500"} />
                            Deep Thinking
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5">
                            {isHighThinking ? "Lebih lambat, lebih dalam" : "Respons lebih cepat"}
                        </span>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${isHighThinking ? 'bg-amber-500' : 'bg-gray-700'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isHighThinking ? 'translate-x-4' : ''}`} />
                    </div>
                </div>

                {/* Knowledge Base */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Context</h3>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                            {selectedDocumentIds.length} Selected
                        </span>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Cari dokumen..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#27272a] bg-[#1a1a1a] focus:outline-none focus:border-dz-primary text-white text-sm placeholder:text-zinc-600 transition-colors"
                            value={ragSearch}
                            onChange={(e) => setRagSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        {availableDocuments.length === 0 ? (
                            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800/30">
                                <p className="text-xs text-blue-300">
                                    Belum ada dokumen di Knowledge Base. Tambahkan melalui menu Knowledge.
                                </p>
                            </div>
                        ) : (() => {
                            const filtered = availableDocuments.filter(doc =>
                                doc.name.toLowerCase().includes(ragSearch.toLowerCase())
                            );
                            return filtered.length === 0
                                ? <p className="text-xs text-zinc-500 text-center py-3">Tidak ada dokumen yang cocok.</p>
                                : filtered.map(doc => {
                                    const isSelected = selectedDocumentIds.includes(doc.id);
                                    return (
                                        <div
                                            key={doc.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-dz-primary/10 border-dz-primary/40' : 'bg-[#1f1f1f] border-[#27272a] hover:border-[#3a3a3a]'}`}
                                            onClick={() => onToggleDocument(doc.id)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText size={16} className={`shrink-0 ${isSelected ? "text-dz-primary" : "text-gray-500"}`} />
                                                <span className="text-sm text-gray-200 truncate">{doc.name}</span>
                                            </div>
                                            {isSelected && <BsFillCheckCircleFill size={14} className="text-dz-primary shrink-0" />}
                                        </div>
                                    );
                                });
                        })()}
                    </div>
                </div>
            </div>

            <div className="border-t border-[#27272a] bg-[#111] px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-dz-primary animate-pulse" />
                <span className="text-xs text-gray-400">Natasha Online</span>
            </div>
        </div>
    );
};
