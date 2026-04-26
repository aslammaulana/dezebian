"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
    const pathname = usePathname()
    const isChatRoute = pathname === "/dashboard/chat"

    useEffect(() => {
        const handleToggle = () => setMobileSidebarOpen(prev => !prev)
        window.addEventListener('toggleMobileSidebar', handleToggle)
        return () => window.removeEventListener('toggleMobileSidebar', handleToggle)
    }, [])

    return (
        <div className="flex h-full flex-col bg-dz-background text-white overflow-x-hidden">
            {/* Mobile Header — only shown on mobile */}
            {!isChatRoute && (
                <div className="fixed top-9 left-0 right-0 z-50 md:hidden">
                    <Header onMenuClick={() => setMobileSidebarOpen(prev => !prev)} />
                </div>
            )}

            <div className={`flex flex-1 min-h-0 overflow-hidden ${isChatRoute ? "" : "pt-16 md:pt-0"}`}>
                {/* Sidebar */}
                <Sidebar
                    mobileOpen={mobileSidebarOpen}
                    onMobileClose={() => setMobileSidebarOpen(false)}
                />

                {/* Mobile overlay backdrop */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-45 bg-black/50 md:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 md:pl-[64px] h-full overflow-hidden bg-dz-background max-w-full">
                    {children}
                </div>
            </div>
        </div>
    )
}
