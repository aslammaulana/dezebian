"use client"

import { useState, useEffect } from "react"
import { Compass, Video, Settings, X, Users, Telescope } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"

interface SidebarProps {
    mobileOpen?: boolean
    onMobileClose?: () => void
}

const menuItems = [
    { href: "/dashboard", icon: Compass, label: "Dashboard", exact: true },
    { href: "/dashboard/reels-content", icon: Video, label: "Reels Content", exact: false },
    { href: "/dashboard/competitor", icon: Users, label: "Competitor", exact: false },
    { href: "/dashboard/atm", icon: Telescope, label: "ATM", exact: false },
    { href: "/dashboard/kategori-konten", icon: Settings, label: "Kategori Konten", exact: false },
]

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
    const pathname = usePathname()

    useEffect(() => {
        if (onMobileClose) onMobileClose()
    }, [pathname])

    const navContent = (isMobile: boolean) => (
        <nav className={clsx("flex flex-col gap-2 px-2 py-4", isMobile ? "" : "")}>
            {menuItems.map((item) => {
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)

                const className = clsx(
                    "flex h-10 w-full items-center justify-start rounded-lg px-3 transition-colors",
                    isActive
                        ? "bg-[#ffffff23] text-white"
                        : "text-zinc-400 hover:bg-[#27272a] hover:text-white"
                )

                return (
                    <Link key={item.href} href={item.href} className={className}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={clsx(
                            "ml-3 overflow-hidden text-sm font-medium whitespace-nowrap",
                            isMobile
                                ? "opacity-100"
                                : "opacity-0 transition-all duration-300 group-hover:opacity-100"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )

    return (
        <>
            {/* ── DESKTOP SIDEBAR — hover to expand ── */}
            <aside className="group hidden md:flex fixed left-0 top-0 z-40 h-screen w-[64px] flex-col border-r-2 border-[#ffffff27] bg-dz-background transition-all duration-300 ease-in-out hover:w-[240px] overflow-y-auto overflow-x-hidden scrollbar-thin">
                {/* Desktop sidebar header */}
                <Link href="/dashboard" className="flex h-14 items-center gap-3 px-3 border-b border-[#ffffff1a] shrink-0">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-dz-primary flex items-center justify-center text-white font-bold text-sm">
                        Dz
                    </div>
                    <span className="text-base font-semibold tracking-tight text-white opacity-0 transition-all duration-300 group-hover:opacity-100 whitespace-nowrap">Dezebian</span>
                </Link>
                {navContent(false)}
            </aside>

            {/* ── MOBILE SIDEBAR — slide in from left ── */}
            <aside className={clsx(
                "fixed left-0 top-0 z-50 h-screen w-[80%] flex-col border-r-2 border-[#ffffff27] bg-dz-background overflow-y-auto overflow-x-hidden transition-transform duration-300 ease-in-out md:hidden scrollbar-thin",
                mobileOpen ? "translate-x-0 flex" : "-translate-x-full flex"
            )}>
                {/* Mobile sidebar header */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-[#ffffff1a]">
                    <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-dz-primary flex items-center justify-center text-white font-bold text-sm">
                            Dz
                        </div>
                        <span className="text-base font-semibold tracking-tight text-white">Dezebian</span>
                    </Link>
                    <button
                        onClick={onMobileClose}
                        className="flex items-center justify-center rounded-lg text-[#ffffffbe] hover:text-[#ffffff] transition-colors cursor-pointer"
                        aria-label="Close sidebar"
                    >
                        <X size={21} />
                    </button>
                </div>
                {navContent(true)}
            </aside>
        </>
    )
}
