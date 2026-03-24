'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, LayoutTemplate, ChevronsUpDown, X, Save, Pencil, ExternalLink, Loader2 } from 'lucide-react'
import clsx from 'clsx'

import { ContentTable } from '@/lib/types'
import { CompetitorSidebar } from '@/components/competitor/CompetitorSidebar'
import { NewCompetitorTableDrawer } from '@/components/competitor/NewCompetitorTableDrawer'

interface Competitor {
    id: string
    competitor: string
    link_instagram: string
    follower: number
    table_id?: string | null
    created_at?: string
}

type SortDir = 'asc' | 'desc'
type SortField = 'competitor' | 'link_instagram' | 'follower'

function formatFollower(n: number): string {
    if (!n && n !== 0) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
}

// ─── Column widths state ───────────────────────────────────────────────────────
const DEFAULT_WIDTHS = { no: 22, competitor: 180, edit: 60, link_instagram: 220, bidang: 150, follower: 100 }

// ─── Sidebar Form ─────────────────────────────────────────────────────────────
interface SidebarFormProps {
    open: boolean
    mode: 'create' | 'edit'
    initialData?: Competitor | null
    tables: ContentTable[]
    defaultTableId: string
    onClose: () => void
    onSaved: () => void
}

function SidebarForm({ open, mode, initialData, tables, defaultTableId, onClose, onSaved }: SidebarFormProps) {
    const [form, setForm] = useState({ competitor: '', link_instagram: '', follower: '', table_id: '' })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setForm({
                    competitor: initialData.competitor || '',
                    link_instagram: initialData.link_instagram || '',
                    follower: initialData.follower != null ? String(initialData.follower) : '',
                    table_id: initialData.table_id || defaultTableId,
                })
            } else {
                setForm({ competitor: '', link_instagram: '', follower: '', table_id: defaultTableId === 'all' ? '' : defaultTableId })
            }
        }
    }, [open, mode, initialData, defaultTableId])

    const handleSave = async () => {
        if (!form.competitor.trim() || !form.table_id) return
        setIsSaving(true)
        try {
            const payload = {
                competitor: form.competitor.trim(),
                link_instagram: form.link_instagram.trim(),
                follower: parseInt(form.follower.replace(/\D/g, ''), 10) || 0,
                table_id: form.table_id
            }

            let res: Response
            if (mode === 'edit' && initialData) {
                res = await fetch('/api/competitors', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: initialData.id, ...payload }),
                })
            } else {
                res = await fetch('/api/competitors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }

            if (res.ok) {
                onSaved()
                onClose()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    const competitorTables = tables
        .filter(t => t.type === 'competitor')
        .sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' }))

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed right-0 top-0 z-50 h-full w-[340px] flex flex-col bg-[#141414] border-l border-[#2e2e2e] shadow-2xl transition-transform duration-300',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#2e2e2e] px-5">
                    <span className="text-sm font-semibold text-white">
                        {mode === 'create' ? 'Tambah Competitor' : 'Edit Competitor'}
                    </span>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center rounded-lg p-1.5 text-zinc-500 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                    {/* Bidang (Category) */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Bidang / Kategori <span className="text-red-400">*</span></label>
                        <select
                            value={form.table_id}
                            onChange={e => setForm(p => ({ ...p, table_id: e.target.value }))}
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors appearance-none"
                        >
                            <option value="" disabled>Pilih Bidang...</option>
                            {competitorTables.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Competitor */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Nama Competitor <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={form.competitor}
                            onChange={e => setForm(p => ({ ...p, competitor: e.target.value }))}
                            placeholder="Nama competitor..."
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                    </div>

                    {/* Link Instagram */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Link Instagram</label>
                        <input
                            type="text"
                            value={form.link_instagram}
                            onChange={e => setForm(p => ({ ...p, link_instagram: e.target.value }))}
                            placeholder="https://instagram.com/..."
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                    </div>

                    {/* Follower */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Follower</label>
                        <input
                            type="number"
                            value={form.follower}
                            onChange={e => setForm(p => ({ ...p, follower: e.target.value }))}
                            placeholder="0"
                            min={0}
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-[#2e2e2e] px-5 py-4 flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-1.5 text-xs text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !form.competitor.trim() || !form.table_id}
                        className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-4 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CompetitorPage() {
    const [tables, setTables] = useState<ContentTable[]>([])
    const [activeTableId, setActiveTableId] = useState<string>('')
    const [rows, setRows] = useState<Competitor[]>([])

    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedRows, setSelectedRows] = useState<string[]>([])

    // Sidebar & Layout state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isTableDrawerOpen, setIsTableDrawerOpen] = useState(false)

    // Form modal state
    const [sidebarOpen, setFormSidebarOpen] = useState(false)
    const [sidebarMode, setSidebarMode] = useState<'create' | 'edit'>('create')
    const [editingRow, setEditingRow] = useState<Competitor | null>(null)

    // Sort
    const [sortField, setSortField] = useState<SortField | null>(null)
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    // Column widths
    const [colWidths, setColWidths] = useState(DEFAULT_WIDTHS)

    // Resizer drag state
    const resizingRef = useRef<{ col: keyof typeof DEFAULT_WIDTHS; startX: number; startW: number } | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsSidebarOpen(false)
        }
    }, [])

    const fetchData = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const [tablesRes, compsRes] = await Promise.all([
                fetch('/api/content-tables'),
                fetch(`/api/competitors${activeTableId && activeTableId !== 'all' ? `?table_id=${activeTableId}` : ''}`)
            ])

            if (tablesRes.ok) {
                const tablesData: ContentTable[] = await tablesRes.json()
                setTables(tablesData)

                const compTables = tablesData.filter(t => t.type === 'competitor')
                if (!activeTableId && compTables.length > 0) {
                    setActiveTableId('all')
                }
            }

            if (compsRes.ok) {
                const data = await compsRes.json()
                setRows(Array.isArray(data) ? data : [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false); setIsRefreshing(false) }
    }, [activeTableId])

    useEffect(() => { fetchData() }, [fetchData])

    // Load competitors explicitly when activeTableId changes without triggering a full screen load if not required
    useEffect(() => {
        if (activeTableId) fetchData()
    }, [activeTableId])

    // ─── Table Management ──────────────────────────────────────────────────────
    const handleCreateTable = async (title: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, type: 'competitor' }),
            })
            if (!res.ok) throw new Error('Failed to create table')
            const newTable = await res.json()
            setTables(prev => [...prev, newTable])
            setActiveTableId(newTable.id)
        } catch (err) { console.error(err) }
    }

    const handleUpdateTable = async (id: string, title: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title }),
            })
            if (!res.ok) throw new Error('Failed to update table')
            const updated = await res.json()
            setTables(prev => prev.map(t => t.id === id ? updated : t))
        } catch (err) { console.error(err) }
    }

    const handleDeleteTable = async (id: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            if (!res.ok) throw new Error('Failed to delete table')
            setTables(prev => prev.filter(t => t.id !== id))
            if (activeTableId === id) setActiveTableId('all')
        } catch (err) { console.error(err) }
    }


    // ─── Inline Updates ────────────────────────────────────────────────────────
    const handleDirectUpdate = async (id: string, field: string, value: string) => {
        // Optimistic update
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
        // If they change table_id, we need to remove it from the current view!
        if (field === 'table_id' && activeTableId !== 'all' && value !== activeTableId) {
            setRows(prev => prev.filter(r => r.id !== id))
        }
        try {
            await fetch('/api/competitors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: value }),
            })
        } catch { fetchData() }
    }

    // ─── Sorting ───────────────────────────────────────────────────────────────
    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('asc') }
    }

    const sorted = [...rows].sort((a, b) => {
        if (!sortField) return 0
        const va = a[sortField]
        const vb = b[sortField]
        if (typeof va === 'number' && typeof vb === 'number')
            return sortDir === 'asc' ? va - vb : vb - va
        return sortDir === 'asc'
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va))
    })

    // ─── Column resizing ───────────────────────────────────────────────────────
    const startResize = (col: keyof typeof DEFAULT_WIDTHS, e: React.MouseEvent) => {
        e.preventDefault()
        resizingRef.current = { col, startX: e.clientX, startW: colWidths[col] }

        const onMove = (ev: MouseEvent) => {
            if (!resizingRef.current) return
            const delta = ev.clientX - resizingRef.current.startX
            const newW = Math.max(40, resizingRef.current.startW + delta)
            setColWidths(prev => ({ ...prev, [resizingRef.current!.col]: newW }))
        }
        const onUp = () => {
            resizingRef.current = null
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    // ─── Sidebar open helpers ──────────────────────────────────────────────────
    const openCreate = () => {
        setSidebarMode('create')
        setEditingRow(null)
        setFormSidebarOpen(true)
    }

    const openEdit = (row: Competitor) => {
        setSidebarMode('edit')
        setEditingRow(row)
        setFormSidebarOpen(true)
    }

    const closeFormSidebar = () => setFormSidebarOpen(false)

    // ─── Delete ────────────────────────────────────────────────────────────────
    const handleDeleteSelected = async () => {
        if (!selectedRows.length) return
        setRows(prev => prev.filter(r => !selectedRows.includes(r.id)))
        setSelectedRows([])
        try {
            await fetch('/api/competitors', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedRows }),
            })
        } catch { fetchData() }
    }

    const toggleSelect = (id: string) =>
        setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const toggleSelectAll = () =>
        setSelectedRows(prev => prev.length === rows.length ? [] : rows.map(r => r.id))

    // ─── Render sort header ───────────────────────────────────────────────────
    const renderSortHeader = (label: string, field: SortField, col: keyof typeof DEFAULT_WIDTHS) => (
        <th
            key={field}
            className="border border-[#2e2e2e] py-2 px-3 text-xs font-semibold uppercase text-zinc-500 relative select-none"
            style={{ width: colWidths[col] }}
        >
            <button
                onClick={() => handleSort(field)}
                className={clsx(
                    'flex items-center gap-1.5 cursor-pointer transition-colors uppercase',
                    sortField === field ? 'text-white/70' : 'text-zinc-500 hover:text-zinc-300'
                )}
            >
                {label}
                <ChevronsUpDown size={12} className={clsx('shrink-0 transition-transform', sortField === field && sortDir === 'desc' ? 'rotate-180' : '')} />
            </button>
            {/* Resizer */}
            <span
                onMouseDown={e => startResize(col, e)}
                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors"
            />
        </th>
    )

    const totalWidth = 40 + colWidths.no + colWidths.competitor + colWidths.edit + colWidths.link_instagram + colWidths.bidang + colWidths.follower

    const activeTable = tables.find(t => t.id === activeTableId)

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                <CompetitorSidebar
                    isOpen={isSidebarOpen}
                    tables={tables}
                    activeTableId={activeTableId}
                    onSelectTable={setActiveTableId}
                    onNewTable={() => setIsTableDrawerOpen(true)}
                    onUpdateTable={handleUpdateTable}
                    onDeleteTable={handleDeleteTable}
                />

                <main className="flex-1 h-full overflow-hidden flex flex-col bg-dz-background">
                    {/* Top Bar */}
                    <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] bg-[#1A1A1A] px-4 gap-3">
                        <div className="flex items-center gap-3">
                            {!isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                >
                                    <LayoutTemplate size={16} />
                                </button>
                            )}
                            <div className="flex items-center gap-2 text-sm text-white font-medium">
                                Competitor: <span className="text-zinc-400 font-normal">{activeTable?.title || 'Semua'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedRows.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                                >
                                    <Trash2 size={13} /> Hapus {selectedRows.length}
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
                                disabled={!activeTableId}
                                className="flex items-center gap-1.5 rounded-md bg-dz-primary px-3 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={13} /> Tambah
                            </button>
                        </div>
                    </div>

                    {!activeTableId ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-zinc-500">
                            <div className="flex flex-col items-center text-center">
                                <h3 className="text-lg font-medium text-white mb-1">Belum Ada Tabel Kategori</h3>
                                <p className="text-sm">Buat kategori pertama untuk mulai menambahkan kompetitor.</p>
                            </div>
                            <button
                                onClick={() => setIsTableDrawerOpen(true)}
                                className="rounded-lg bg-dz-primary px-5 py-2 text-sm font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer"
                            >
                                + New Table
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="flex-1 overflow-auto scrollbar-thin">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-zinc-500 text-sm">Loading...</div>
                                ) : (
                                    <table
                                        className="border-collapse text-left"
                                        style={{ tableLayout: 'fixed', width: totalWidth, minWidth: '100%' }}
                                    >
                                        <colgroup>
                                            <col style={{ width: 40 }} />
                                            <col style={{ width: colWidths.no }} />
                                            <col style={{ width: colWidths.competitor }} />
                                            <col style={{ width: colWidths.edit }} />
                                            <col style={{ width: colWidths.link_instagram }} />
                                            <col style={{ width: colWidths.bidang }} />
                                            <col style={{ width: colWidths.follower }} />
                                        </colgroup>
                                        <thead className="bg-[#1A1A1A] sticky top-0 z-10">
                                            <tr>
                                                {/* Checkbox */}
                                                <th className="border border-[#2e2e2e] py-2 px-3 text-center w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
                                                        checked={selectedRows.length === rows.length && rows.length > 0}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                {/* No. */}
                                                <th
                                                    className="border border-[#2e2e2e] py-2 px-3 text-xs font-semibold uppercase text-zinc-500 relative select-none"
                                                    style={{ width: colWidths.no }}
                                                >
                                                    NO.
                                                    <span
                                                        onMouseDown={e => startResize('no', e)}
                                                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors"
                                                    />
                                                </th>
                                                {renderSortHeader('Competitor', 'competitor', 'competitor')}
                                                {/* Edit col header */}
                                                <th
                                                    className="border border-[#2e2e2e] py-2 px-3 text-xs font-semibold uppercase text-zinc-500 relative select-none"
                                                    style={{ width: colWidths.edit }}
                                                >
                                                    Edit
                                                    <span
                                                        onMouseDown={e => startResize('edit', e)}
                                                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors"
                                                    />
                                                </th>
                                                {renderSortHeader('Link Instagram', 'link_instagram', 'link_instagram')}
                                                {/* Bidang col header */}
                                                <th
                                                    className="border border-[#2e2e2e] py-2 px-3 text-xs font-semibold uppercase text-zinc-500 relative select-none"
                                                    style={{ width: colWidths.bidang }}
                                                >
                                                    Bidang
                                                    <span
                                                        onMouseDown={e => startResize('bidang', e)}
                                                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors"
                                                    />
                                                </th>
                                                {renderSortHeader('Follower', 'follower', 'follower')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-zinc-600 text-sm italic">
                                                        Belum ada data di bidang ini. Klik &quot;Tambah&quot;.
                                                    </td>
                                                </tr>
                                            ) : (
                                                sorted.map((row, idx) => (
                                                    <tr
                                                        key={row.id}
                                                        className={clsx(
                                                            'group transition-colors',
                                                            selectedRows.includes(row.id) ? 'bg-white/2' : 'hover:bg-[#1e1e1e]'
                                                        )}
                                                    >
                                                        <td className="border border-[#2e2e2e] py-2 px-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
                                                                checked={selectedRows.includes(row.id)}
                                                                onChange={() => toggleSelect(row.id)}
                                                            />
                                                        </td>
                                                        {/* No. */}
                                                        <td className="border border-[#2e2e2e] py-2 px-3 text-zinc-500 text-xs">{idx + 1}</td>
                                                        {/* Competitor */}
                                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                                            <span className="block w-full truncate text-sm text-zinc-200">{row.competitor || <span className="text-zinc-600 italic">—</span>}</span>
                                                        </td>
                                                        {/* Edit button */}
                                                        <td className="border border-[#2e2e2e] py-1.5 px-2 text-center">
                                                            <button
                                                                onClick={() => openEdit(row)}
                                                                className="inline-flex items-center gap-1 rounded-sm bg-[#27272a] px-2 py-1 text-[10px] font-semibold uppercase text-zinc-400 hover:bg-dz-primary/20 hover:text-white/70 transition-colors cursor-pointer"
                                                                title="Edit row ini"
                                                            >
                                                                <Pencil size={11} />
                                                                EDIT
                                                            </button>
                                                        </td>
                                                        {/* Link Instagram — clickable */}
                                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                                            {row.link_instagram ? (
                                                                <a
                                                                    href={row.link_instagram.startsWith('http') ? row.link_instagram : `https://${row.link_instagram}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 w-full truncate text-sm text-sky-400 hover:text-sky-300 transition-colors"
                                                                    title={row.link_instagram}
                                                                >
                                                                    <span className="truncate">{row.link_instagram}</span>
                                                                    <ExternalLink size={11} className="shrink-0" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-zinc-600 italic text-sm">—</span>
                                                            )}
                                                        </td>
                                                        {/* Bidang Inline Select */}
                                                        <td className="border border-[#2e2e2e] py-1.5 px-2">
                                                            <select
                                                                value={row.table_id || activeTableId}
                                                                onChange={(e) => handleDirectUpdate(row.id, 'table_id', e.target.value)}
                                                                className="w-full truncate rounded px-1.5 py-1 text-xs outline-none transition-colors bg-[#27272a] text-zinc-300 hover:text-white cursor-pointer focus:border-dz-primary border border-transparent focus:border-solid hover:bg-[#3a3a3a]"
                                                            >
                                                                {tables.filter(t => t.type === 'competitor').map(t => (
                                                                    <option key={t.id} value={t.id}>{t.title}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        {/* Follower */}
                                                        <td className="border border-[#2e2e2e] py-2 px-3 text-right">
                                                            <span className="block w-full text-right text-sm font-mono text-zinc-300">
                                                                {formatFollower(row.follower)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 border-t border-[#27272a] bg-[#1A1A1A] px-4 py-2 text-xs text-zinc-600">
                                {rows.length} data kompetitor
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Drawers & Modals */}
            <NewCompetitorTableDrawer
                isOpen={isTableDrawerOpen}
                onClose={() => setIsTableDrawerOpen(false)}
                onSubmit={handleCreateTable}
            />

            <SidebarForm
                open={sidebarOpen}
                mode={sidebarMode}
                initialData={editingRow}
                tables={tables}
                defaultTableId={activeTableId}
                onClose={closeFormSidebar}
                onSaved={fetchData}
            />
        </div>
    )
}
