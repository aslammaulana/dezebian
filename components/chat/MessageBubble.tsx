"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Role, Message } from '@/types/chat';
import { Citations, renderContent } from '@/utils/markdown';
import { FaTrash } from 'react-icons/fa';

interface MessageBubbleProps {
    message: Message;
    onDelete: () => void;
    isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onDelete, isStreaming = false }) => {
    const isUser = message.role === Role.USER;
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCopy = () => {
        try {
            const el = document.createElement('textarea');
            el.value = message.content;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    return (
        <div id={`msg-${message.id}`} className={`flex w-full mb-6 group ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[75%] gap-1 md:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-2 h-2 md:w-3 md:h-3 rounded-full shadow-lg ${isUser ? 'bg-[#2b51a1]' : 'bg-dz-primary'}`} />

                <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`relative p-4 rounded-xl text-sm shadow-lg w-full ${isUser
                        ? 'bg-[#273c69] text-white rounded-br-none'
                        : message.isError
                            ? 'bg-red-900/20 border border-red-500/50 text-red-200 rounded-bl-none'
                            : 'bg-[#35353586] text-[#ffffffc5] leading-relaxed border border-[#ffffff23] rounded-bl-none'
                        }`}>
                        {!message.isError && !isStreaming && (
                            <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-gray-400 z-10">
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        )}

                        <div className="font-sans wrap-break-words pr-8">
                            {renderContent(message.content)}
                            {isStreaming && (
                                <span className="inline-block w-[2px] h-[1em] bg-dz-primary ml-0.5 align-middle animate-pulse" />
                            )}
                        </div>

                        {message.groundingMetadata?.groundingChunks && (
                            <Citations chunks={message.groundingMetadata.groundingChunks} />
                        )}
                    </div>

                    <div className={`flex items-center gap-1 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-[#ffffff7a]">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        {!isStreaming && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-[#ffffffb4] hover:text-red-500 p-0.5 rounded transition-colors text-[10px] cursor-pointer"
                            >
                                <FaTrash size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                    <div className="bg-[#1e1e1e] border border-[#27272a] rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Hapus Pesan?</h3>
                                <p className="text-sm text-gray-400 mt-1">Pesan ini akan dihapus secara permanen.</p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#272727] text-gray-300 hover:bg-[#333] hover:text-white transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsDeleting(true);
                                        await onDelete();
                                        setTimeout(() => {
                                            setIsDeleting(false);
                                            setShowDeleteConfirm(false);
                                        }, 1000);
                                    }}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#962a2a] text-white hover:bg-[#702121] transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                                >
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Hapus"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
