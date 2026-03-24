'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Loader2, LayoutList, Pencil } from 'lucide-react'

interface SelectOption {
    id: string
    category: string
    value: string
    label: string | null
    order_index: number
}

const CATEGORIES = [
    { key: 'format', label: 'Format' },
    { key: 'content_type', label: 'Tipe Konten' },
    { key: 'section', label: 'Section' },
    { key: 'sub_section', label: 'Sub-Section' },
    { key: 'target_audience', label: 'Target Audiens' },
    { key: 'funnel', label: 'Tujuan / Funnel' },
    { key: 'offer_status', label: 'Status Penawaran' },
    { key: 'brand', label: 'Brand' },
]

function CategoryPanel({ categoryKey, categoryLabel }: { categoryKey: string; categoryLabel: string }) {
    const [options, setOptions] = useState<SelectOption[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newValue, setNewValue] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    const fetchOptions = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/select-options?category=${categoryKey}`)
            if (res.ok) setOptions(await res.json())
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchOptions() }, [categoryKey])

    const handleAdd = async () => {
        if (!newValue.trim()) return
        setIsAdding(true)
        try {
            const res = await fetch('/api/select-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: categoryKey, value: newValue.trim(), order_index: options.length }),
            })
            if (res.ok) {
                const created = await res.json()
                setOptions(prev => [...prev, created])
                setNewValue('')
            }
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async (id: string) => {
        await fetch('/api/select-options', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        setOptions(prev => prev.filter(o => o.id !== id))
    }

    const startEdit = (opt: SelectOption) => {
        setEditingId(opt.id)
        setEditValue(opt.label || opt.value)
    }

    const commitEdit = async (id: string) => {
        if (!editValue.trim()) { setEditingId(null); return }
        const res = await fetch('/api/select-options', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, value: editValue.trim(), label: editValue.trim() }),
        })
        if (res.ok) {
            const updated = await res.json()
            setOptions(prev => prev.map(o => o.id === id ? updated : o))
        }
        setEditingId(null)
    }

    return (
        <div className="rounded-xl border border-[#27272a] bg-[#1a1a1a] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#141414]">
                <h3 className="text-sm font-semibold text-white">{categoryLabel}</h3>
                <span className="text-[11px] text-zinc-500 bg-[#27272a] rounded-full px-2 py-0.5">{options.length} item</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-64 scrollbar-thin">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={18} className="animate-spin text-zinc-500" />
                    </div>
                ) : options.length === 0 ? (
                    <p className="px-4 py-6 text-xs text-zinc-600 text-center italic">Belum ada opsi. Tambahkan di bawah.</p>
                ) : (
                    <ul className="divide-y divide-[#222]">
                        {options.map(opt => (
                            <li key={opt.id} className="flex items-center gap-2 px-4 py-2.5 group hover:bg-[#1f1f1f] transition-colors">
                                <GripVertical size={13} className="text-zinc-700 shrink-0" />
                                {editingId === opt.id ? (
                                    <input
                                        autoFocus
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => commitEdit(opt.id)}
                                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(opt.id); if (e.key === 'Escape') setEditingId(null) }}
                                        className="flex-1 rounded-md bg-[#27272a] px-2 py-1 text-sm text-white outline-none border border-dz-primary"
                                    />
                                ) : (
                                    <span className="flex-1 text-sm text-zinc-300 truncate">{opt.label || opt.value}</span>
                                )}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => startEdit(opt)} className="rounded p-1 text-zinc-500 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer">
                                        <Pencil size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(opt.id)} className="rounded p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-[#27272a] bg-[#141414]">
                <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                    placeholder={`Tambah ${categoryLabel}...`}
                    className="flex-1 rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors"
                />
                <button
                    onClick={handleAdd}
                    disabled={!newValue.trim() || isAdding}
                    className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-3 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Add
                </button>
            </div>
        </div>
    )
}

export default function KategoriKontenPage() {
    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            <div className="flex h-[50px] shrink-0 items-center gap-3 border-b border-[#27272a] bg-[#1A1A1A] px-4">
                <LayoutList size={15} className="text-zinc-400" />
                <h1 className="text-sm font-semibold text-white">Kategori Konten</h1>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-base font-semibold text-white mb-1">Daftar Select Options</h2>
                        <p className="text-sm text-zinc-500">
                            Kelola pilihan dropdown untuk field-field di form konten. Perubahan langsung tersimpan dan akan muncul di form edit.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {CATEGORIES.map(cat => (
                            <CategoryPanel key={cat.key} categoryKey={cat.key} categoryLabel={cat.label} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
