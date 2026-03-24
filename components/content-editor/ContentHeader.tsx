'use client'

import { Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ContentHeaderProps {
    title?: string
}

export function ContentHeader({ title = 'Reels Content' }: ContentHeaderProps) {
    return (
        <div className="flex h-[44px] shrink-0 items-center gap-1.5 px-4 border-b border-[#27272a] bg-[#1A1A1A]">
            <Link href="/dashboard" className="flex items-center text-zinc-500 hover:text-white transition-colors">
                <Home size={13} />
            </Link>
            <ChevronRight size={12} className="text-zinc-700" />
            <span className="text-sm font-medium text-white">{title}</span>
        </div>
    )
}
