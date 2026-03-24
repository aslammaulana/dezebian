import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";

export const metadata: Metadata = {
    title: "Dashboard — Dezebian",
    description: "Content Planning Dashboard",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell>
            {children}
        </DashboardShell>
    );
}
