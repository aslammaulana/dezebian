"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Role, Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
    isStreaming?: boolean;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    onScrollChange?: (isAtBottom: boolean) => void;
}

export interface ChatAreaHandle {
    scrollToBottom: () => void;
    scrollToMessage: (id: number) => void;
}

const ChatArea = forwardRef<ChatAreaHandle, ChatAreaProps>(
    ({ messages, isLoading, isStreaming = false, setMessages, onScrollChange }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
        const bottomRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            scrollToBottom() {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            },
            scrollToMessage(id: number) {
                const el = messageRefs.current.get(id);
                const container = containerRef.current;
                if (el && container) {
                    const elRect = el.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    container.scrollTo({
                        top: container.scrollTop + (elRect.top - containerRect.top) - 12,
                        behavior: "smooth",
                    });
                }
            },
        }));

        useEffect(() => {
            const container = containerRef.current;
            if (!container || !onScrollChange) return;
            const handleScroll = () => {
                const { scrollTop, scrollHeight, clientHeight } = container;
                onScrollChange(scrollHeight - scrollTop - clientHeight < 80);
            };
            container.addEventListener("scroll", handleScroll, { passive: true });
            return () => container.removeEventListener("scroll", handleScroll);
        }, [onScrollChange]);

        const handleDeleteMessage = async (id: string | number) => {
            const originalMessages = [...messages];
            setMessages(prev => prev.filter(msg => msg.id !== id));
            try {
                const res = await fetch("/api/chat/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                });
                if (!res.ok) throw new Error("Gagal menghapus");
            } catch (err) {
                console.error(err);
                setMessages(originalMessages);
            }
        };

        const displayMessages = [...messages]
            .filter(msg => msg.role !== Role.SYSTEM)
            .sort((a, b) => Number(a.id) - Number(b.id));

        const lastMsgId = displayMessages.length > 0 ? displayMessages[displayMessages.length - 1].id : null;

        const getDateKey = (ts: number) => {
            const d = new Date(ts);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        };

        return (
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-[#171717] text-gray-200 scroll-smooth scrollbar-thin"
            >
                {displayMessages.map((msg, idx) => {
                    const showSeparator =
                        idx > 0 &&
                        getDateKey(msg.timestamp) !== getDateKey(displayMessages[idx - 1].timestamp);

                    return (
                        <React.Fragment key={msg.id}>
                            {showSeparator && (
                                <div className="flex items-center justify-center my-4">
                                    <div className="px-3 py-1 rounded-full bg-[#1e1e1e] border border-[#27272a] text-xs text-gray-400 select-none">
                                        {new Date(msg.timestamp).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                                    </div>
                                </div>
                            )}
                            <div
                                ref={el => {
                                    if (el) messageRefs.current.set(Number(msg.id), el);
                                    else messageRefs.current.delete(Number(msg.id));
                                }}
                            >
                                <MessageBubble
                                    message={msg}
                                    onDelete={() => handleDeleteMessage(msg.id!)}
                                    isStreaming={isStreaming && msg.id === lastMsgId && msg.role === Role.MODEL}
                                />
                            </div>
                        </React.Fragment>
                    );
                })}

                {isLoading && (
                    <div className="flex w-full justify-start mb-6">
                        <div className="flex gap-3">
                            <div className="shrink-0 w-3 h-3 rounded-full bg-dz-primary" />
                            <div className="bg-[#272727] px-4 py-2.5 rounded-lg rounded-bl-none border border-[#27272a] flex items-center gap-2.5">
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} className="h-4" />
            </div>
        );
    }
);

ChatArea.displayName = "ChatArea";
export default ChatArea;
