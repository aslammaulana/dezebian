'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, LayoutTemplate, ChevronsUpDown, X, Save, Pencil, ExternalLink, Loader2, Eye, FileText, Search, UserSearch } from 'lucide-react'
import clsx from 'clsx'

import { ContentTable } from '@/lib/types'
import { ContentTypeSidebar } from '@/components/content-type/ContentTypeSidebar'
import { NewContentTypeTableDrawer } from '@/components/content-type/NewContentTypeTableDrawer'

interface ContentType {
    id: string
    topik: string
    link_instagram: string
    jenis: string | null
    content_type: string | null
    deskripsi: string | null
    views: number
    table_id: string
    competitor_id: string | null
    created_at?: string
}

interface Competitor {
    id: string
    competitor: string
}

type SortDir = 'asc' | 'desc'
type SortField = 'topik' | 'link_instagram' | 'views' | 'table_id' | 'competitor_id'

function formatViews(n: number): string {
    if (!n && n !== 0) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
}

// ─── Column widths state ───────────────────────────────────────────────────────
const DEFAULT_WIDTHS = { no: 40, topik: 230, edit: 130, link_instagram: 160, competitor: 160, jenis: 160, type_col: 140, views: 70 }

// ─── Competitor Picker Modal ─────────────────────────────────────────────────
interface CompetitorPickerModalProps {
    open: boolean
    competitors: Competitor[]
    selectedId: string
    onSelect: (id: string, name: string) => void
    onClose: () => void
}

function CompetitorPickerModal({ open, competitors, selectedId, onSelect, onClose }: CompetitorPickerModalProps) {
    const [search, setSearch] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setSearch('')
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    const filtered = competitors.filter(c =>
        c.competitor.toLowerCase().includes(search.toLowerCase())
    )

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/2 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-[#141414] border border-[#2e2e2e] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] bg-[#1A1A1A]">
                    <div className="flex items-center gap-2">
                        <UserSearch size={15} className="text-zinc-400" />
                        <span className="text-sm font-semibold text-white">Pilih Competitor</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-zinc-500 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 py-2.5 border-b border-[#2e2e2e]">
                    <div className="flex items-center gap-2 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-1.5 focus-within:border-[#ffffff31] transition-colors">
                        <Search size={13} className="text-zinc-500 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari competitor..."
                            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto max-h-64 py-1 scrollbar-thin">
                    {/* Tidak ada option */}
                    <button
                        onClick={() => { onSelect('', '—'); onClose() }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${selectedId === ''
                            ? 'bg-dz-primary text-white/80'
                            : 'text-zinc-500 hover:bg-[#27272a] hover:text-white'
                            }`}
                    >
                        — Tidak ada —
                    </button>

                    {filtered.length === 0 && search && (
                        <p className="px-4 py-3 text-xs text-zinc-600 italic">Tidak ditemukan "{search}"</p>
                    )}

                    {filtered.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { onSelect(c.id, c.competitor); onClose() }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${selectedId === c.id
                                ? 'bg-dz-primary text-white/80'
                                : 'text-zinc-200 hover:bg-[#27272a] hover:text-white'
                                }`}
                        >
                            {c.competitor}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Sidebar Form ─────────────────────────────────────────────────────────────
interface SidebarFormProps {
    open: boolean
    mode: 'create' | 'edit'
    initialData?: ContentType | null
    tables: ContentTable[]
    competitors: Competitor[]
    defaultTableId: string
    onClose: () => void
    onSaved: () => void
}

function SidebarForm({ open, mode, initialData, tables, competitors, defaultTableId, onClose, onSaved }: SidebarFormProps) {
    const [form, setForm] = useState({ topik: '', link_instagram: '', views: '', table_id: '', deskripsi: '', competitor_id: '', content_type: '' })
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [showCompetitorPicker, setShowCompetitorPicker] = useState(false)

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setForm({
                    topik: initialData.topik || '',
                    link_instagram: initialData.link_instagram || '',
                    views: initialData.views != null ? String(initialData.views) : '',
                    table_id: initialData.table_id || defaultTableId,
                    deskripsi: initialData.deskripsi || '',
                    competitor_id: initialData.competitor_id || '',
                    content_type: initialData.content_type || '',
                })
            } else {
                setForm({ topik: '', link_instagram: '', views: '', table_id: defaultTableId === 'all' ? '' : defaultTableId, deskripsi: '', competitor_id: '', content_type: '' })
            }
        }
    }, [open, mode, initialData, defaultTableId])

    const handleSave = async () => {
        if (!form.topik.trim() || !form.table_id) return
        setIsSaving(true)
        setSaveError(null)
        try {
            const payload = {
                topik: form.topik.trim(),
                link_instagram: form.link_instagram.trim(),
                views: parseInt(form.views.replace(/\D/g, ''), 10) || 0,
                table_id: form.table_id,
                deskripsi: form.deskripsi.trim() || null,
                competitor_id: form.competitor_id || null,
                content_type: form.content_type || null,
            }

            let res: Response
            if (mode === 'edit' && initialData) {
                res = await fetch('/api/content-types', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: initialData.id, ...payload }),
                })
            } else {
                res = await fetch('/api/content-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }

            if (res.ok) {
                onSaved()
                onClose()
            } else {
                const errData = await res.json().catch(() => ({}))
                setSaveError(errData?.error || 'Gagal menyimpan. Cek koneksi atau struktur database.')
            }
        } catch (err) {
            console.error(err)
            setSaveError('Terjadi kesalahan jaringan.')
        } finally {
            setIsSaving(false)
        }
    }

    const contentTypeTables = tables
        .filter(t => t.type === 'content-type')
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
                    'fixed right-0 top-0 z-50 h-full w-[440px] flex flex-col bg-[#141414] border-l border-[#2e2e2e] shadow-2xl transition-transform duration-300',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#2e2e2e] px-5">
                    <span className="text-sm font-semibold text-white">
                        {mode === 'create' ? 'Tambah Konten' : 'Edit Konten'}
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
                    {/* Grup / Table */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Grup / Tabel <span className="text-red-400">*</span></label>
                        <select
                            value={form.table_id}
                            onChange={e => setForm(p => ({ ...p, table_id: e.target.value }))}
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors appearance-none"
                        >
                            <option value="" disabled>Pilih Grup...</option>
                            {contentTypeTables.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
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

                    {/* Topik */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Topik <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={form.topik}
                            onChange={e => setForm(p => ({ ...p, topik: e.target.value }))}
                            placeholder="Topik konten..."
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                    </div>

                    {/* Competitor */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Competitor (Referensi)</label>
                        <button
                            type="button"
                            onClick={() => setShowCompetitorPicker(true)}
                            className="w-full flex items-center justify-between rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-left transition-colors hover:border-dz-primary/50 cursor-pointer"
                        >
                            <span className={form.competitor_id ? 'text-white' : 'text-zinc-600'}>
                                {form.competitor_id
                                    ? competitors.find(c => c.id === form.competitor_id)?.competitor || '— Tidak ada —'
                                    : '— Tidak ada —'
                                }
                            </span>
                            <UserSearch size={14} className="text-zinc-500 shrink-0" />
                        </button>
                        <CompetitorPickerModal
                            open={showCompetitorPicker}
                            competitors={competitors}
                            selectedId={form.competitor_id}
                            onSelect={(id) => setForm(p => ({ ...p, competitor_id: id }))}
                            onClose={() => setShowCompetitorPicker(false)}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Type</label>
                        <select
                            value={form.content_type}
                            onChange={e => setForm(p => ({ ...p, content_type: e.target.value }))}
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors appearance-none"
                        >
                            <option value="">— Pilih Type —</option>
                            <option value="No Face">No Face</option>
                            <option value="No Face + VO">No Face + VO</option>
                            <option value="VO">VO</option>
                            <option value="VO + Face">VO + Face</option>
                        </select>
                    </div>

                    {/* Views */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Views</label>
                        <input
                            type="number"
                            value={form.views}
                            onChange={e => setForm(p => ({ ...p, views: e.target.value }))}
                            placeholder="0"
                            min={0}
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                        />
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Deskripsi</label>
                        <textarea
                            value={form.deskripsi}
                            onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                            placeholder="Deskripsi konten..."
                            rows={8}
                            className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-[#2e2e2e] px-5 py-4 flex flex-col gap-2">
                    {saveError && (
                        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
                    )}
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg px-4 py-1.5 text-xs text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !form.topik.trim() || !form.table_id}
                            className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-4 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type CompetitorPickerTarget = { rowId: string; currentId: string } | null
export default function ContentTypePage() {
    const [tables, setTables] = useState<ContentTable[]>([])
    const [activeTableId, setActiveTableId] = useState<string>('')
    const [rows, setRows] = useState<ContentType[]>([])
    const [competitors, setCompetitors] = useState<Competitor[]>([])

    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedRows, setSelectedRows] = useState<string[]>([])

    // Sidebar & Layout state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isTableDrawerOpen, setIsTableDrawerOpen] = useState(false)

    // Form modal state
    const [sidebarOpen, setFormSidebarOpen] = useState(false)
    const [sidebarMode, setSidebarMode] = useState<'create' | 'edit'>('create')

    // Deskripsi popup state
    const [deskripsiPopup, setDeskripsiPopup] = useState<ContentType | null>(null)
    const [editingRow, setEditingRow] = useState<ContentType | null>(null)

    // Competitor picker popup state (for table inline)
    const [competitorPickerTarget, setCompetitorPickerTarget] = useState<CompetitorPickerTarget>(null)

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
            const [tablesRes, rowsRes, competitorsRes] = await Promise.all([
                fetch('/api/content-tables'),
                fetch(`/api/content-types${activeTableId && activeTableId !== 'all' ? `?table_id=${activeTableId}` : ''}`),
                fetch('/api/competitors'),
            ])

            if (tablesRes.ok) {
                const tablesData: ContentTable[] = await tablesRes.json()
                setTables(tablesData)

                const ctTables = tablesData.filter(t => t.type === 'content-type')
                if (!activeTableId && ctTables.length > 0) {
                    setActiveTableId('all')
                }
            }

            if (rowsRes.ok) {
                const data = await rowsRes.json()
                setRows(Array.isArray(data) ? data : [])
            }

            if (competitorsRes.ok) {
                const data = await competitorsRes.json()
                const sorted = Array.isArray(data) ? data.sort((a, b) => (a.competitor || '').localeCompare(b.competitor || '', undefined, { sensitivity: 'base' })) : []
                setCompetitors(sorted)
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false); setIsRefreshing(false) }
    }, [activeTableId])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        if (activeTableId) fetchData()
    }, [activeTableId])

    // ─── Table Management ──────────────────────────────────────────────────────
    const handleCreateTable = async (title: string) => {
        try {
            const res = await fetch('/api/content-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, type: 'content-type' }),
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
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
        if (field === 'table_id' && activeTableId !== 'all' && value !== activeTableId) {
            setRows(prev => prev.filter(r => r.id !== id))
        }
        try {
            await fetch('/api/content-types', {
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
        let va: any = a[sortField]
        let vb: any = b[sortField]

        if (sortField === 'table_id') {
            va = tables.find(t => t.id === a.table_id)?.title || ''
            vb = tables.find(t => t.id === b.table_id)?.title || ''
        }

        if (sortField === 'competitor_id') {
            va = competitors.find(c => c.id === a.competitor_id)?.competitor || ''
            vb = competitors.find(c => c.id === b.competitor_id)?.competitor || ''
        }

        if (typeof va === 'number' && typeof vb === 'number')
            return sortDir === 'asc' ? va - vb : vb - va
        return sortDir === 'asc'
            ? String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' })
            : String(vb).localeCompare(String(va), undefined, { numeric: true, sensitivity: 'base' })
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

    const openEdit = (row: ContentType) => {
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
            await fetch('/api/content-types', {
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

    const totalWidth = 40 + colWidths.no + colWidths.topik + colWidths.edit + colWidths.link_instagram + colWidths.competitor + colWidths.jenis + colWidths.type_col + colWidths.views

    const activeTable = tables.find(t => t.id === activeTableId)
    const contentTypeTables = tables.filter(t => t.type === 'content-type')

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                <ContentTypeSidebar
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
                                Content Type: <span className="text-zinc-400 font-normal">{activeTable?.title || 'Semua'}</span>
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
                                <h3 className="text-lg font-medium text-white mb-1">Belum Ada Tabel Grup</h3>
                                <p className="text-sm">Buat grup pertama untuk mulai menambahkan konten.</p>
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
                                        style={{ tableLayout: 'fixed', width: totalWidth }}
                                    >
                                        <colgroup>
                                            <col style={{ width: 40 }} />
                                            <col style={{ width: colWidths.no }} />
                                            <col style={{ width: colWidths.topik }} />
                                            <col style={{ width: colWidths.edit }} />
                                            <col style={{ width: colWidths.link_instagram }} />
                                            <col style={{ width: colWidths.competitor }} />
                                            <col style={{ width: colWidths.jenis }} />
                                            <col style={{ width: colWidths.type_col }} />
                                            <col style={{ width: colWidths.views }} />
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
                                                {renderSortHeader('Topik', 'topik', 'topik')}
                                                {/* Action col header */}
                                                <th
                                                    className="border border-[#2e2e2e] py-2 px-3 text-xs font-semibold uppercase text-zinc-500 relative select-none"
                                                    style={{ width: colWidths.edit }}
                                                >
                                                    Action
                                                    <span
                                                        onMouseDown={e => startResize('edit', e)}
                                                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors"
                                                    />
                                                </th>
                                                {renderSortHeader('Link Instagram', 'link_instagram', 'link_instagram')}
                                                {renderSortHeader('Competitor', 'competitor_id', 'competitor')}
                                                {renderSortHeader('Jenis', 'table_id', 'jenis')}
                                                {/* Type header */}
                                                <th
                                                    className="border border-[#2e2e2e] py-2 px-3 text-xs font-semibold uppercase text-zinc-500 relative select-none"
                                                    style={{ width: colWidths.type_col }}
                                                >
                                                    Type
                                                    <span
                                                        onMouseDown={e => startResize('type_col', e)}
                                                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors"
                                                    />
                                                </th>
                                                {renderSortHeader('Views', 'views', 'views')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="py-12 text-center text-zinc-600 text-sm italic">
                                                        Belum ada data di grup ini. Klik &quot;Tambah&quot;.
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
                                                        {/* Topik */}
                                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                                            <span className="block w-full truncate text-sm text-zinc-200">{row.topik || <span className="text-zinc-600 italic">—</span>}</span>
                                                        </td>
                                                        {/* Action: Edit + Deskripsi */}
                                                        <td className="border border-[#2e2e2e] py-1.5 px-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => openEdit(row)}
                                                                    className="inline-flex items-center gap-1 rounded-sm bg-[#27272a] px-2 py-1 text-[10px] font-semibold uppercase text-zinc-400 hover:bg-dz-primary/20 hover:text-white/70 transition-colors cursor-pointer"
                                                                    title="Edit row ini"
                                                                >
                                                                    <Pencil size={11} />
                                                                    EDIT
                                                                </button>
                                                                {row.deskripsi ? (
                                                                    <button
                                                                        onClick={() => setDeskripsiPopup(row)}
                                                                        className="inline-flex items-center gap-1 rounded-sm bg-[#27272a] px-2 py-1 text-[10px] font-semibold uppercase text-zinc-400 hover:bg-sky-500/20 hover:text-sky-300 transition-colors cursor-pointer"
                                                                    >
                                                                        <Eye size={11} />
                                                                        DESC
                                                                    </button>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-sm bg-[#1c1c1c] px-2 py-1 text-[10px] font-semibold uppercase text-zinc-700 cursor-default">
                                                                        <Eye size={11} />
                                                                        DESC
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                        {/* Competitor inline button */}
                                                        <td className="border border-[#2e2e2e] py-1.5 px-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCompetitorPickerTarget({ rowId: row.id, currentId: row.competitor_id || '' })}
                                                                className="w-full flex items-center justify-between gap-1 truncate rounded px-1.5 py-1 text-xs transition-colors bg-[#27272a] text-zinc-300 hover:text-white hover:bg-[#3a3a3a] cursor-pointer border border-transparent hover:border-dz-primary/40"
                                                                title="Pilih Competitor"
                                                            >
                                                                <span className="truncate">
                                                                    {row.competitor_id
                                                                        ? competitors.find(c => c.id === row.competitor_id)?.competitor || '—'
                                                                        : '—'
                                                                    }
                                                                </span>
                                                                <UserSearch size={11} className="shrink-0 text-zinc-500" />
                                                            </button>
                                                        </td>
                                                        {/* Jenis Inline Select */}
                                                        <td className="border border-[#2e2e2e] py-1.5 px-2">
                                                            <select
                                                                value={row.jenis || ''}
                                                                onChange={(e) => handleDirectUpdate(row.id, 'jenis', e.target.value)}
                                                                className="w-full truncate rounded px-1.5 py-1 text-xs outline-none transition-colors bg-[#27272a] text-zinc-300 hover:text-white cursor-pointer focus:border-dz-primary border border-transparent focus:border-solid hover:bg-[#3a3a3a]"
                                                            >
                                                                <option value="">—</option>
                                                                {contentTypeTables.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.title}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        {/* Type Inline Select */}
                                                        <td className="border border-[#2e2e2e] py-1.5 px-2">
                                                            <select
                                                                value={row.content_type || ''}
                                                                onChange={(e) => handleDirectUpdate(row.id, 'content_type', e.target.value)}
                                                                className="w-full truncate rounded px-1.5 py-1 text-xs outline-none transition-colors bg-[#27272a] text-zinc-300 hover:text-white cursor-pointer focus:border-dz-primary border border-transparent focus:border-solid hover:bg-[#3a3a3a]"
                                                            >
                                                                <option value="">—</option>
                                                                <option value="No Face">No Face</option>
                                                                <option value="No Face + VO">No Face + VO</option>
                                                                <option value="VO">VO</option>
                                                                <option value="VO + Face">VO + Face</option>
                                                            </select>
                                                        </td>
                                                        {/* Views */}
                                                        <td className="border border-[#2e2e2e] py-2 px-3 text-right">
                                                            <span className="block w-full text-right text-sm font-mono text-zinc-300">
                                                                {formatViews(row.views)}
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
                                {rows.length} data konten
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Drawers & Modals */}
            <NewContentTypeTableDrawer
                isOpen={isTableDrawerOpen}
                onClose={() => setIsTableDrawerOpen(false)}
                onSubmit={handleCreateTable}
            />

            <SidebarForm
                open={sidebarOpen}
                mode={sidebarMode}
                initialData={editingRow}
                tables={tables}
                competitors={competitors}
                defaultTableId={activeTableId}
                onClose={closeFormSidebar}
                onSaved={fetchData}
            />

            {/* Competitor Picker Modal (for table inline) */}
            <CompetitorPickerModal
                open={competitorPickerTarget !== null}
                competitors={competitors}
                selectedId={competitorPickerTarget?.currentId || ''}
                onSelect={(id) => {
                    if (competitorPickerTarget) {
                        handleDirectUpdate(competitorPickerTarget.rowId, 'competitor_id', id)
                    }
                }}
                onClose={() => setCompetitorPickerTarget(null)}
            />

            {/* Deskripsi Popup */}
            {deskripsiPopup && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setDeskripsiPopup(null)}
                >
                    <div
                        className="bg-[#141414] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#27272a] flex justify-between items-center bg-[#1A1A1A]">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="text-zinc-400 shrink-0" size={18} />
                                <h2 className="text-base font-bold text-white truncate">{deskripsiPopup.topik}</h2>
                            </div>
                            <button
                                onClick={() => setDeskripsiPopup(null)}
                                className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors ml-4 shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {deskripsiPopup.deskripsi}
                            </p>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-[#27272a] flex justify-end bg-[#1A1A1A]">
                            <button
                                onClick={() => setDeskripsiPopup(null)}
                                className="px-5 py-2 bg-transparent border border-[#27272a] hover:bg-[#2c2c2e] text-zinc-300 text-sm rounded-lg transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
