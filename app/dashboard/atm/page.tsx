'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Telescope, X, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

interface AtmEntry {
    id: string
    link_instagram: string
    topik: string
    problem: string
    solusi: string
    visual: string
    hook_script: string
    created_at?: string
}

const FIELDS: { key: keyof Omit<AtmEntry, 'id' | 'created_at'>; label: string; multiline?: boolean }[] = [
    { key: 'link_instagram', label: 'Link Instagram' },
    { key: 'topik', label: 'Topik' },
    { key: 'problem', label: 'Problem', multiline: true },
    { key: 'solusi', label: 'Solusi', multiline: true },
    { key: 'visual', label: 'Visual', multiline: true },
    { key: 'hook_script', label: 'Hook Script', multiline: true },
]

// ─── Sidebar (slide from right) ───────────────────────────────────────────────
interface SidebarProps {
    isOpen: boolean
    entry: Partial<AtmEntry> | null
    isNew: boolean
    onClose: () => void
    onSave: (data: Omit<AtmEntry, 'id' | 'created_at'>) => void
}

function AtmSidebar({ isOpen, entry, isNew, onClose, onSave }: SidebarProps) {
    const [form, setForm] = useState<Omit<AtmEntry, 'id' | 'created_at'>>({
        link_instagram: '',
        topik: '',
        problem: '',
        solusi: '',
        visual: '',
        hook_script: '',
    })

    // Reset form when entry changes
    useEffect(() => {
        setForm({
            link_instagram: entry?.link_instagram ?? '',
            topik: entry?.topik ?? '',
            problem: entry?.problem ?? '',
            solusi: entry?.solusi ?? '',
            visual: entry?.visual ?? '',
            hook_script: entry?.hook_script ?? '',
        })
    }, [entry])

    const handleChange = (key: string, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }))

    return (
        <>
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
                                    value={form[key]}
                                    onChange={e => handleChange(key, e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-[#3a3a3a] bg-[#1f1f1f] px-3 py-2.5 text-sm text-white outline-none focus:border-dz-primary resize-none scrollbar-thin transition-colors"
                                    placeholder={`Tulis ${label.toLowerCase()}...`}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={form[key]}
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
        setActiveEntry({ link_instagram: '', topik: '', problem: '', solusi: '', visual: '', hook_script: '' })
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
                        {entries.map((entry, idx) => {
                            const isSelected = selectedIds.includes(entry.id)
                            return (
                                <div
                                    key={entry.id}
                                    className={clsx(
                                        'group relative flex flex-col gap-3 rounded-xl border p-4 transition-all cursor-pointer',
                                        isSelected
                                            ? 'border-dz-primary bg-dz-primary/10'
                                            : 'border-[#2e2e2e] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e]'
                                    )}
                                    onClick={() => openEdit(entry)}
                                >
                                    {/* Checkbox */}
                                    <div
                                        className="absolute top-3 right-3"
                                        onClick={e => { e.stopPropagation(); toggleSelect(entry.id) }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => { }}
                                            className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 cursor-pointer"
                                            style={{ opacity: isSelected ? 1 : 0 }}
                                        />
                                    </div>

                                    {/* Number + Link */}
                                    <div className="flex items-center gap-2 pr-5">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#27272a] text-[10px] font-bold text-zinc-400">
                                            {idx + 1}
                                        </span>
                                        {entry.link_instagram && (
                                            <a
                                                href={entry.link_instagram.startsWith('http') ? entry.link_instagram : `https://${entry.link_instagram}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center gap-1 text-xs text-sky-400 hover:underline truncate"
                                            >
                                                <ExternalLink size={10} className="shrink-0" />
                                                {entry.link_instagram}
                                            </a>
                                        )}
                                    </div>

                                    <div className="border-t border-[#2e2e2e]" />

                                    <div className="flex flex-col gap-3">
                                        <FieldRow label="Topik" value={entry.topik} />
                                        <FieldRow label="Problem" value={entry.problem} />
                                        <FieldRow label="Solusi" value={entry.solusi} />
                                        <FieldRow label="Visual" value={entry.visual} />
                                        <FieldRow label="Hook Script" value={entry.hook_script} />
                                    </div>

                                    <p className="mt-auto pt-1 text-[10px] text-zinc-700 group-hover:text-zinc-600 transition-colors">
                                        Klik untuk edit
                                    </p>
                                </div>
                            )
                        })}
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
