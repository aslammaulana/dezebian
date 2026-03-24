// app/dashboard/memory/page.tsx
import type { Metadata } from "next";
import MemoryClient from "@/components/memory/MemoryClient";

export const metadata: Metadata = {
    title: "Memory Manager | Dezebian",
    description: "Kelola memori Natasha: Milestone dan Meta-Milestone",
};

export const dynamic = "force-dynamic";

export default function MemoryPage() {
    return <MemoryClient />;
}
