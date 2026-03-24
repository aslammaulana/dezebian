"use client"

import { Menu } from "lucide-react"

interface HeaderProps {
    onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="flex h-16 items-center gap-3 border-b border-[#27272a] bg-dz-background px-4">
            <button
                onClick={onMenuClick}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle menu"
            >
                <Menu size={20} />
            </button>
            <span className="text-base font-semibold text-white tracking-tight">Dezebian</span>
        </header>
    )
}
