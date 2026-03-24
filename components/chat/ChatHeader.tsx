"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Zap, Database, Menu } from 'lucide-react';
import { MdReplay } from 'react-icons/md';

interface ChatHeaderProps {
    uploadedFilesCount: number;
    isWebSearchEnabled: boolean;
    onMenuClick: () => void;
    isSidebarOpen: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    uploadedFilesCount,
    isWebSearchEnabled,
    onMenuClick,
    isSidebarOpen,
}) => {
    return (
        <header className="h-[50px] border-b border-[#27272a] flex items-center px-4 justify-between bg-[#1A1A1A] z-40 shrink-0">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className={`p-2 -ml-2 rounded-full flex items-center justify-center transition-colors ${isSidebarOpen
                        ? 'text-dz-primary bg-dz-primary/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Menu size={18} />
                </button>
                <span className="font-semibold text-sm text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-dz-primary animate-pulse" />
                    Chat Ai
                </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <span className={`px-3 py-1 rounded-full border flex items-center gap-1.5 font-medium transition-colors ${isWebSearchEnabled ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-[#27272a] text-zinc-500'}`}>
                    {isWebSearchEnabled ? <Globe size={12} /> : <Zap size={12} />}
                    {isWebSearchEnabled ? 'Web Search' : 'Default'}
                </span>
                {uploadedFilesCount > 0 && (
                    <span className="px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1.5 font-medium">
                        <Database size={12} />
                        {uploadedFilesCount}
                    </span>
                )}
                <button
                    onClick={() => window.location.reload()}
                    className="p-2 rounded-full flex items-center justify-center transition-all text-[18px] hover:bg-white/10 text-zinc-500 hover:text-white"
                >
                    <MdReplay />
                </button>
            </div>
        </header>
    );
};
