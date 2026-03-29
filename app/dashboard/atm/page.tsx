'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Telescope, X, ExternalLink, Pin, Pencil } from 'lucide-react'
import clsx from 'clsx'

interface AtmEntry {
    id: string
    link_instagram: string
    topik: string
    problem: string
    solusi: string
    pinned?: boolean
    created_at?: string
}

const FIELDS: { key: keyof AtmForm; label: string; multiline?: boolean }[] = [
    { key: 'link_instagram', label: 'Link Instagram' },
    { key: 'topik', label: 'Topik' },
    { key: 'problem', label: 'Problem', multiline: true },
    { key: 'solusi', label: 'Solusi', multiline: true },
]

// ─── Sidebar (slide from right) ───────────────────────────────────────────────
interface AtmForm {
    link_instagram: string
    topik: string
    problem: string
    solusi: string
}

interface SidebarProps {
    isOpen: boolean
    entry: Partial<AtmEntry> | null
    isNew: boolean
    onClose: () => void
    onSave: (data: AtmForm) => void
}

function AtmSidebar({ isOpen, entry, isNew, onClose, onSave }: SidebarProps) {
    const [form, setForm] = useState<AtmForm>({
        link_instagram: '',
        topik: '',
        problem: '',
        solusi: '',
    })

    // Reset form when entry changes
    useEffect(() => {
        setForm({
            link_instagram: entry?.link_instagram ?? '',
            topik: entry?.topik ?? '',
            problem: entry?.problem ?? '',
            solusi: entry?.solusi ?? '',
        })
    }, [entry])

    const handleChange = (key: string, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }))

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <aside
                className={clsx(
                    'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#27272a] bg-[#141414] shadow-2xl transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] px-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Telescope size={15} className="text-dz-primary" />
                        {isNew ? 'Tambah ATM Baru' : 'Edit ATM'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Fields */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-4">
                    {FIELDS.map(({ key, label, multiline }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                                {label}
                            </label>
                            {multiline ? (
                                <textarea
                                    value={form[key] as string}
                                    onChange={e => handleChange(key, e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 py-2.5 text-sm text-white outline-none focus:border-dz-primary resize-none scrollbar-thin transition-colors"
                                    placeholder={`Tulis ${label.toLowerCase()}...`}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={form[key] as string}
                                    onChange={e => handleChange(key, e.target.value)}
                                    className="w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 py-2.5 text-sm text-white outline-none focus:border-dz-primary transition-colors"
                                    placeholder={`Masukkan ${label.toLowerCase()}...`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer actions */}
                <div className="shrink-0 border-t border-[#27272a] p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-[#3a3a3a] px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="rounded-lg bg-dz-primary px-5 py-2 text-sm font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer"
                    >
                        Simpan
                    </button>
                </div>
            </aside>
        </>
    )
}

// ─── Card field row ────────────────────────────────────────────────────────────
function FieldRow({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
    if (!value) return null
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</span>
            {isLink ? (
                <a
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:underline break-all"
                >
                    {value} <ExternalLink size={10} className="shrink-0" />
                </a>
            ) : (
                <p className="text-sm text-zinc-300 leading-relaxed">{value}</p>
            )}
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AtmPage() {
    const [entries, setEntries] = useState<AtmEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeEntry, setActiveEntry] = useState<Partial<AtmEntry> | null>(null)
    const [isNew, setIsNew] = useState(false)

    const fetchData = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/atm')
            const data = await res.json()
            setEntries(Array.isArray(data) ? data : [])
        } catch (err) { console.error(err) }
        finally { setLoading(false); setIsRefreshing(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const openCreate = () => {
        setActiveEntry({ link_instagram: '', topik: '', problem: '', solusi: '' })
        setIsNew(true)
        setSidebarOpen(true)
    }

    const openEdit = (entry: AtmEntry) => {
        setActiveEntry(entry)
        setIsNew(false)
        setSidebarOpen(true)
    }

    const handleSave = async (formData: Omit<AtmEntry, 'id' | 'created_at'>) => {
        if (isNew) {
            const res = await fetch('/api/atm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            if (res.ok) {
                const newEntry = await res.json()
                setEntries(prev => [...prev, newEntry])
            }
        } else if (activeEntry?.id) {
            const id = activeEntry.id
            setEntries(prev => prev.map(e => e.id === id ? { ...e, ...formData } : e))
            await fetch('/api/atm', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...formData }),
            })
        }
        setSidebarOpen(false)
    }

    const handleDelete = async () => {
        if (!selectedIds.length) return
        setEntries(prev => prev.filter(e => !selectedIds.includes(e.id)))
        setSelectedIds([])
        await fetch('/api/atm', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds }),
        })
    }

    const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setEntries(prev => prev.filter(entry => entry.id !== id))
        await fetch('/api/atm', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [id] }),
        })
    }

    const handleTogglePin = async (id: string, currentPinned: boolean, e: React.MouseEvent) => {
        e.stopPropagation()
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, pinned: !currentPinned } : entry))
        await fetch('/api/atm', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, pinned: !currentPinned }),
        })
    }

    const toggleSelect = (id: string) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            {/* Top Bar */}
            <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] bg-[#1A1A1A] px-4 gap-3">
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                    <Telescope size={15} className="text-zinc-400" />
                    ATM (Amati, Tiru, Modifikasi)
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                        >
                            <Trash2 size={13} /> Hapus {selectedIds.length}
                        </button>
                    )}
                    <button
                        onClick={fetchData}
                        className={clsx(
                            'flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer',
                            isRefreshing && 'animate-spin'
                        )}
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 rounded-md bg-dz-primary px-3 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer"
                    >
                        <Plus size={13} /> Tambah ATM
                    </button>
                </div>
            </div>

            {/* Card Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-zinc-500 text-sm">Loading...</div>
                ) : entries.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-600">
                        <Telescope size={40} className="opacity-30" />
                        <p className="text-sm italic">Belum ada ATM. Klik &quot;Tambah ATM&quot; untuk mulai.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...entries].sort((a, b) => {
                            if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
                            return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
                        }).map((entry, idx) => (
                            <div
                                key={entry.id}
                                className={clsx(
                                    'flex flex-col rounded-xl border transition-colors',
                                    entry.pinned ? 'border-dz-primary/40 bg-[#141414]' : 'border-[#27272a] bg-[#141414]'
                                )}
                            >
                                {/* Card Body */}
                                <div
                                    className="p-5 flex-1 cursor-pointer"
                                    onClick={() => openEdit(entry)}
                                >
                                    {/* Header: No + Topik */}
                                    <div className="flex items-start gap-2 mb-3">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#27272a] text-[10px] font-bold text-zinc-400 mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <p className="font-semibold text-[15px] text-white leading-snug">
                                            {entry.topik || <span className="text-zinc-600 italic">Tanpa Topik</span>}
                                        </p>
                                        {entry.pinned && (
                                            <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] font-semibold text-dz-primary bg-dz-primary/10 border border-dz-primary/20 px-2 py-0.5 rounded-full mt-0.5">
                                                <Pin size={9} />Pinned
                                            </span>
                                        )}
                                    </div>

                                    {/* Link */}
                                    {entry.link_instagram && (
                                        <a
                                            href={entry.link_instagram.startsWith('http') ? entry.link_instagram : `https://${entry.link_instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-center gap-1 text-xs text-sky-400 hover:underline mb-3 truncate"
                                        >
                                            <ExternalLink size={10} className="shrink-0" />
                                            {entry.link_instagram}
                                        </a>
                                    )}

                                    {/* Problem */}
                                    {entry.problem && (
                                        <div className="mb-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Problem</span>
                                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">{entry.problem}</p>
                                        </div>
                                    )}

                                    {/* Solusi */}
                                    {entry.solusi && (
                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Solusi</span>
                                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">{entry.solusi}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="px-4 py-3 border-t border-[#27272a] flex justify-between items-center bg-[#111] rounded-b-xl">
                                    <span className="text-xs text-zinc-600">
                                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString('id-ID') : '—'}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => handleTogglePin(entry.id, entry.pinned ?? false, e)}
                                            className={clsx(
                                                'p-2 rounded transition-colors cursor-pointer',
                                                entry.pinned ? 'text-dz-primary' : 'text-zinc-500 hover:text-white'
                                            )}
                                            title={entry.pinned ? 'Unpin' : 'Pin'}
                                        >
                                            <Pin size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(entry) }}
                                            className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteOne(entry.id, e)}
                                            className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                            title="Hapus"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-[#27272a] bg-[#1A1A1A] px-4 py-2 text-xs text-zinc-600">
                {entries.length} entri
            </div>

            {/* Sidebar */}
            <AtmSidebar
                isOpen={sidebarOpen}
                entry={activeEntry}
                isNew={isNew}
                onClose={() => setSidebarOpen(false)}
                onSave={handleSave}
            />
        </div>
    )
}
