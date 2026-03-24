"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ChatArea, { ChatAreaHandle } from "@/components/chat/ChatArea";
import { Role, Message, AvailableDocument } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { InputArea } from "@/components/chat/Input";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { FiLoader } from "react-icons/fi";
import { ChevronDown } from "lucide-react";

const loadHistoryFromDB = async (): Promise<Message[]> => {
    try {
        const res = await fetch("/api/chat/history");
        if (!res.ok) throw new Error("Gagal memuat riwayat chat");
        const data: Message[] = await res.json();
        return data.map((msg) => ({ ...msg, id: Number(msg.id) }));
    } catch {
        return [];
    }
};

const loadAvailableDocuments = async (): Promise<AvailableDocument[]> => {
    try {
        const res = await fetch("/api/knowledge/list");
        if (!res.ok) throw new Error("Gagal memuat daftar dokumen.");
        return await res.json();
    } catch {
        return [];
    }
};

export default function ChatClient() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [availableDocuments, setAvailableDocuments] = useState<AvailableDocument[]>([]);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHighThinking, setIsHighThinking] = useState(false);

    const chatAreaRef = useRef<ChatAreaHandle>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const reloadData = useCallback(async () => {
        setIsInitialLoading(true);
        const [history, docs] = await Promise.all([loadHistoryFromDB(), loadAvailableDocuments()]);
        setMessages(history);
        setAvailableDocuments(docs);
        setIsInitialLoading(false);
        setTimeout(() => chatAreaRef.current?.scrollToBottom(), 100);
    }, []);

    useEffect(() => { reloadData(); }, [reloadData]);

    const handleToggleDocument = (id: string) => {
        setSelectedDocumentIds(prev =>
            prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
        );
    };

    const handleSendMessage = async (): Promise<void> => {
        if (!inputValue.trim() || isLoading) return;
        const currentText = inputValue;
        setInputValue("");
        setIsLoading(true);

        const tempUserId = Date.now();
        const tempAssistantId = tempUserId + 1;
        const userMsg: Message = { id: tempUserId, role: Role.USER, content: currentText, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setTimeout(() => chatAreaRef.current?.scrollToMessage(tempUserId), 150);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newMessage: currentText,
                    selectedDocumentIds,
                    useWebSearch: isWebSearchEnabled,
                    useHighThinking: isHighThinking,
                }),
            });

            if (!response.ok) throw new Error("Gagal kirim");
            const data = await response.json();
            const assistantMsg: Message = {
                id: tempAssistantId,
                role: Role.MODEL,
                content: data.text || "",
                groundingMetadata: data.groundingMetadata ?? undefined,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            setTimeout(() => chatAreaRef.current?.scrollToBottom(), 100);
        } catch (error) {
            console.error(error);
            setMessages(prev => prev.filter(m => m.id !== tempUserId && m.id !== tempAssistantId));
        } finally {
            setIsLoading(false);
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#171717] text-gray-400">
                <FiLoader size={38} className="animate-pulse text-dz-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#171717] text-gray-100 overflow-hidden font-sans">
            <main className="flex-1 flex flex-col relative w-full h-full">
                <ChatHeader
                    uploadedFilesCount={selectedDocumentIds.length}
                    isWebSearchEnabled={isWebSearchEnabled}
                    isSidebarOpen={isSidebarOpen}
                    onMenuClick={() => setIsSidebarOpen(prev => !prev)}
                />
                <ChatArea
                    ref={chatAreaRef}
                    messages={messages}
                    isLoading={isLoading}
                    setMessages={setMessages}
                    onScrollChange={setIsAtBottom}
                />

                {/* Scroll-to-bottom button */}
                <div className="relative shrink-0">
                    <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 ${isAtBottom ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
                        <button
                            onClick={() => chatAreaRef.current?.scrollToBottom()}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#272727] border border-[#3a3a3a] text-gray-300 hover:bg-dz-primary hover:border-dz-primary hover:text-white shadow-lg transition-all duration-200 cursor-pointer"
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                <InputArea
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    selectedDocuments={availableDocuments.filter(doc => selectedDocumentIds.includes(doc.id))}
                    isWebSearchEnabled={isWebSearchEnabled}
                    isSidebarOpen={isSidebarOpen}
                    onOpenSidebar={() => setIsSidebarOpen(prev => !prev)}
                />
            </main>
            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                availableDocuments={availableDocuments}
                selectedDocumentIds={selectedDocumentIds}
                onToggleDocument={handleToggleDocument}
                isWebSearchEnabled={isWebSearchEnabled}
                setIsWebSearchEnabled={setIsWebSearchEnabled}
                isHighThinking={isHighThinking}
                setIsHighThinking={setIsHighThinking}
            />
        </div>
    );
}
