'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Eye, Pencil } from 'lucide-react'
import clsx from 'clsx'
import { ContentHeader } from '@/components/content-editor/ContentHeader'
import { BankContentSidebar } from '@/components/bank-content/BankContentSidebar'
import { BankContentQuickEditSidebar } from '@/components/bank-content/BankContentQuickEditSidebar'
import { BankContent, BankContentStatus } from '@/lib/types'

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_BADGE: Record<BankContentStatus, string> = {
    'Draft': 'text-zinc-400 bg-zinc-800 border-zinc-700',
    'Development': 'text-blue-400 bg-blue-900/40 border-blue-800',
    'Need Review': 'text-orange-400 bg-orange-900/40 border-orange-800',
    'Published': 'text-green-400 bg-green-900/40 border-green-800',
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function BankContentPage() {
    const router = useRouter()
    const [contents, setContents] = useState<BankContent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInsertOpen, setIsInsertOpen] = useState(false)
    const [quickEditContent, setQuickEditContent] = useState<BankContent | null>(null)
    const [search, setSearch] = useState('')

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/bank-content')
            if (!res.ok) throw new Error('Failed to fetch')
            const data: BankContent[] = await res.json()
            setContents(data)
        } catch (err) {
            console.error('Error loading bank content:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreate = async (data: {
        topik_masalah: string
        status: BankContentStatus
        hook?: string
        penyebab?: string
        solusi?: string
        fitur_unggulan?: string
        cta?: string
    }) => {
        const res = await fetch('/api/bank-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create')
        const newItem: BankContent = await res.json()
        setContents(prev => [newItem, ...prev])
    }

    const handleQuickSave = (updated: BankContent) => {
        setContents(prev => prev.map(c => c.id === updated.id ? updated : c))
    }

    const filtered = contents.filter(c =>
        c.topik_masalah?.toLowerCase().includes(search.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dz-background">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            <ContentHeader title="Bank Content" />

            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#27272a] bg-[#141414] shrink-0">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari topik masalah..."
                        className="w-full max-w-xs rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors"
                    />
                    <button
                        onClick={() => setIsInsertOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer shrink-0"
                    >
                        <Plus size={15} />
                        Insert Row
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto scrollbar-thin">
                    {filtered.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
                            <div className="flex flex-col items-center text-center">
                                <h3 className="text-lg font-medium text-white mb-1">
                                    {search ? 'Tidak ditemukan' : 'Belum ada konten'}
                                </h3>
                                <p className="text-sm">
                                    {search ? 'Coba kata kunci lain.' : 'Klik "+ Insert Row" untuk menambahkan konten pertama.'}
                                </p>
                            </div>
                            {!search && (
                                <button
                                    onClick={() => setIsInsertOpen(true)}
                                    className="rounded-lg bg-dz-primary px-5 py-2 text-sm font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer"
                                >
                                    + Insert Row
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#141414] border-b border-[#27272a]">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 w-8">#</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Topik Masalah</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 w-36">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 w-28 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors group"
                                    >
                                        {/* No */}
                                        <td className="px-4 py-3 text-zinc-600 text-xs">{idx + 1}</td>

                                        {/* Topik Masalah — klik untuk quick edit */}
                                        <td
                                            className="px-4 py-3 text-white font-medium cursor-pointer hover:text-dz-primary transition-colors"
                                            onClick={() => setQuickEditContent(item)}
                                        >
                                            {item.topik_masalah}
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-4 py-3">
                                            <span className={clsx(
                                                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                                                STATUS_BADGE[item.status] || STATUS_BADGE['Draft']
                                            )}>
                                                {item.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => router.push(`/dashboard/bank-content/view/${item.id}`)}
                                                    title="View"
                                                    className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/dashboard/bank-content/edit/${item.id}`)}
                                                    title="Edit"
                                                    className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <Pencil size={13} />
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Insert Sidebar */}
            <BankContentSidebar
                isOpen={isInsertOpen}
                onClose={() => setIsInsertOpen(false)}
                onSubmit={handleCreate}
            />

            {/* Quick Edit Sidebar */}
            <BankContentQuickEditSidebar
                content={quickEditContent}
                onClose={() => setQuickEditContent(null)}
                onSave={handleQuickSave}
                onOpenFull={(id) => router.push(`/dashboard/bank-content/edit/${id}`)}
            />

            {/* Desktop backdrop for insert sidebar */}
            {isInsertOpen && (
                <div
                    className="fixed inset-0 z-40 hidden xl:block"
                    onClick={() => setIsInsertOpen(false)}
                />
            )}
        </div>
    )
}
