// app/dashboard/chat/page.tsx
import type { Metadata } from "next";
import ChatClient from "@/components/chat/ChatClient";

export const metadata: Metadata = {
    title: "Chat Natasha | Dezebian",
    description: "Chat dengan Natasha, AI Marketing Strategist Dezebian",
};

export default function ChatPage() {
    return (
        <div className="h-full">
            <ChatClient />
        </div>
    );
}
