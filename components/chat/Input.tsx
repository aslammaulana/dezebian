"use client";

import React, { useRef, useEffect } from 'react';
import { Globe, Database, Menu } from 'lucide-react';
import { BiArrowToTop } from "react-icons/bi";
import { IoTrashBin, IoCopyOutline } from "react-icons/io5";
import { MdOutlineAssistant } from "react-icons/md";
import { AvailableDocument } from '@/types/chat';

interface InputAreaProps {
    inputValue: string;
    setInputValue: (value: string) => void;
    handleSendMessage: () => Promise<void>;
    isLoading: boolean;
    selectedDocuments: AvailableDocument[];
    isWebSearchEnabled: boolean;
    onOpenSidebar: () => void;
    isSidebarOpen: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
    inputValue,
    setInputValue,
    handleSendMessage,
    isLoading,
    selectedDocuments,
    isWebSearchEnabled,
    onOpenSidebar,
    isSidebarOpen,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (inputValue === '' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [inputValue]);

    const handleClearText = () => {
        setInputValue("");
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleCopyText = () => {
        if (inputValue.trim()) navigator.clipboard.writeText(inputValue);
    };

    const handlePasteAIPure = () => setInputValue("MODE AI_PURE.\n\n\n");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const isDesktop = typeof window !== "undefined" && !/Mobi|Android/i.test(navigator.userAgent);
        if (isDesktop && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const hasContext = selectedDocuments.length > 0 || isWebSearchEnabled;

    return (
        <div className="shrink-0">
            <div className="max-w-[800px] p-4 mx-auto relative">
                {/* Context Indicators */}
                <div className={`absolute -top-12 left-0 flex gap-2 overflow-x-auto max-w-full pb-2 ${hasContext ? 'opacity-100' : 'opacity-0'}`}>
                    {selectedDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center gap-1 bg-blue-900/60 border border-blue-700 text-xs text-blue-300 px-3 py-1 rounded-full whitespace-nowrap">
                            <Database size={12} />
                            <span className="max-w-[120px] truncate">{doc.name}</span>
                        </div>
                    ))}
                    {isWebSearchEnabled && (
                        <div className="flex items-center gap-1.5 text-xs text-green-300 bg-green-900/30 px-3 py-1 rounded-full">
                            <Globe size={12} />
                            <span>Web Search ON</span>
                        </div>
                    )}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                    <div className="rounded-2xl border border-[#48484b] overflow-hidden">
                        <div className="bg-[#2C2C2E] px-4 pt-4 pb-3">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={hasContext ? "Tanya dengan konteks yang dipilih..." : "Tulis pesan ke Natasha..."}
                                className="w-full bg-transparent text-gray-100 min-h-[22px] max-h-48 focus:outline-none placeholder-[#8E8E93] resize-none text-[15px] leading-relaxed"
                                rows={1}
                            />
                        </div>

                        <div className="bg-[#2C2C2E] border-t border-[#48484b] px-3 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={onOpenSidebar}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-[#48484b] ${isSidebarOpen ? 'bg-dz-primary text-white border-dz-primary' : 'bg-[#252527dc] text-gray-300 hover:bg-[#48484A] hover:text-white'}`}
                                    title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}>
                                    <Menu size={18} />
                                </button>
                                <button type="button" onClick={handlePasteAIPure}
                                    className="w-10 h-10 rounded-full bg-[#252527dc] border border-[#48484b] text-gray-300 hover:bg-[#48484A] hover:text-white flex items-center justify-center transition-all duration-200 text-[20px]"
                                    title="Gunakan Mode AI_PURE">
                                    <MdOutlineAssistant />
                                </button>
                                <button type="button" onClick={handleClearText}
                                    className="w-10 h-10 rounded-full bg-[#252527dc] border border-[#38383A] text-gray-300 hover:bg-[#48484A] hover:text-white flex items-center justify-center transition-all duration-200 text-[20px]"
                                    title="Clear Text">
                                    <IoTrashBin />
                                </button>
                                <button type="button" onClick={handleCopyText}
                                    className="w-10 h-10 rounded-full bg-[#252527dc] border border-[#48484b] text-gray-300 hover:bg-[#48484A] hover:text-white flex items-center justify-center transition-all duration-200 text-[20px]"
                                    title="Salin teks">
                                    <IoCopyOutline />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="w-10 h-10 rounded-full bg-[#5686fe] hover:bg-[#4a75e6] text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-[20px]"
                            >
                                <BiArrowToTop />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
