'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, LayoutTemplate } from 'lucide-react'
import clsx from 'clsx'
import { ContentTable } from '@/lib/types'

interface CompetitorSidebarProps {
    isOpen: boolean
    tables: ContentTable[]
    activeTableId: string
    onSelectTable: (id: string) => void
    onNewTable: () => void
    onUpdateTable: (id: string, title: string) => void
    onDeleteTable: (id: string) => void
}

export function CompetitorSidebar({
    isOpen,
    tables,
    activeTableId,
    onSelectTable,
    onNewTable,
    onUpdateTable,
    onDeleteTable,
}: CompetitorSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

    // filter only competitor tables and sort them alpha-numerically
    const competitorTables = tables
        .filter(t => t.type === 'competitor')
        .sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' }))

    const startEdit = (t: ContentTable) => {
        setEditingId(t.id)
        setEditTitle(t.title)
        setMenuOpenId(null)
    }

    const commitEdit = () => {
        if (editingId && editTitle.trim()) {
            onUpdateTable(editingId, editTitle.trim())
        }
        setEditingId(null)
    }

    if (!isOpen) return null

    const renderRow = (t: ContentTable) => {
        const isActive = t.id === activeTableId
        return (
            <div key={t.id} className="relative group/row">
                {editingId === t.id ? (
                    <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                        className="w-full rounded-md bg-[#27272a] px-3 py-2 text-[13px] text-white outline-none border border-dz-primary"
                    />
                ) : (
                    <>
                        <button
                            onClick={() => onSelectTable(t.id)}
                            className={clsx(
                                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors text-left',
                                isActive
                                    ? 'bg-[#27272a] text-white'
                                    : 'text-zinc-400 hover:bg-[#27272a] hover:text-white'
                            )}
                        >
                            <LayoutTemplate size={15} className="shrink-0" />
                            <span className="flex-1 truncate">{t.title}</span>
                        </button>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === t.id ? null : t.id) }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setMenuOpenId(menuOpenId === t.id ? null : t.id) } }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 rounded p-0.5 text-zinc-500 hover:text-white transition-opacity cursor-pointer"
                        >
                            <MoreHorizontal size={14} />
                        </div>
                    </>
                )}

                {menuOpenId === t.id && (
                    <div className="absolute right-2 top-8 z-50 flex flex-col rounded-lg border border-[#27272a] bg-[#1A1A1A] shadow-xl py-1 w-36">
                        <button onClick={() => startEdit(t)} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer">
                            <Pencil size={12} /> Rename
                        </button>
                        <button onClick={() => { onDeleteTable(t.id); setMenuOpenId(null) }} className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer">
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <aside className="flex h-full w-[220px] flex-col shrink-0 border-r border-[#27272a] bg-[#141414] overflow-y-auto scrollbar-thin">

            <div className="p-4 flex flex-col gap-1">
                <h2 className="text-base font-bold text-white mb-3">Bidang / Kategori</h2>

                <button
                    onClick={() => onSelectTable('all')}
                    className={clsx(
                        'mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors text-left',
                        activeTableId === 'all'
                            ? 'bg-[#27272a] text-white'
                            : 'text-zinc-400 hover:bg-[#27272a] hover:text-white'
                    )}
                >
                    <LayoutTemplate size={15} className="shrink-0" />
                    <span className="flex-1 truncate">Lihat Semua</span>
                </button>

                <button
                    onClick={onNewTable}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#3a3a3a] py-1.5 text-sm text-zinc-300 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                >
                    <Plus size={14} /> New Table
                </button>

                <div className="mt-2 mb-1 px-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Daftar Tabel</span>
                </div>

                {competitorTables.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-zinc-600 italic">Belum ada tabel</p>
                ) : (
                    competitorTables.map(renderRow)
                )}
            </div>
        </aside >
    )
}
