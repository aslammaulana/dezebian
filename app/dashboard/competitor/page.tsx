'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, LayoutTemplate, ChevronsUpDown } from 'lucide-react'
import clsx from 'clsx'

interface Competitor {
    id: string
    competitor: string
    link_instagram: string
    follower: number
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
const DEFAULT_WIDTHS = { no: 52, competitor: 220, link_instagram: 260, follower: 130 }

export default function CompetitorPage() {
    const [rows, setRows] = useState<Competitor[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedRows, setSelectedRows] = useState<string[]>([])

    // Sort
    const [sortField, setSortField] = useState<SortField | null>(null)
    const [sortDir, setSortDir] = useState<SortDir>('asc')

    // Column widths
    const [colWidths, setColWidths] = useState(DEFAULT_WIDTHS)

    // Inline editing
    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
    const [editValue, setEditValue] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Resizer drag state
    const resizingRef = useRef<{ col: keyof typeof DEFAULT_WIDTHS; startX: number; startW: number } | null>(null)

    const fetchData = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/competitors')
            const data = await res.json()
            setRows(Array.isArray(data) ? data : [])
        } catch (err) { console.error(err) }
        finally { setLoading(false); setIsRefreshing(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        if (editingCell && inputRef.current) inputRef.current.focus()
    }, [editingCell])

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
            const newW = Math.max(60, resizingRef.current.startW + delta)
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

    // ─── Inline edit ──────────────────────────────────────────────────────────
    const startEdit = (id: string, field: string, val: string | number) => {
        setEditingCell({ id, field })
        setEditValue(String(val ?? ''))
    }

    const commitEdit = async () => {
        if (!editingCell) return
        const { id, field } = editingCell
        const value = field === 'follower' ? parseInt(editValue.replace(/\D/g, ''), 10) || 0 : editValue
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
        setEditingCell(null)
        try {
            const res = await fetch('/api/competitors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: value }),
            })
            if (!res.ok) fetchData()
        } catch { fetchData() }
    }

    const cancelEdit = () => setEditingCell(null)

    // ─── CRUD ─────────────────────────────────────────────────────────────────
    const handleAddRow = async () => {
        try {
            const res = await fetch('/api/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competitor: 'Competitor Baru', link_instagram: '', follower: 0 }),
            })
            if (!res.ok) return
            const newRow = await res.json()
            setRows(prev => [...prev, newRow])
        } catch (err) { console.error(err) }
    }

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
                    sortField === field ? 'text-dz-primary' : 'text-zinc-500 hover:text-zinc-300'
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

    // ─── Render editable cell ─────────────────────────────────────────────────
    const renderCell = (row: Competitor, field: 'competitor' | 'link_instagram') => {
        const isEditing = editingCell?.id === row.id && editingCell?.field === field
        const val = row[field]

        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                    className="w-full rounded bg-[#27272a] border border-dz-primary px-2 py-0.5 text-sm text-white outline-none"
                />
            )
        }

        return (
            <span
                role="button"
                tabIndex={0}
                onDoubleClick={() => startEdit(row.id, field, val)}
                onKeyDown={e => { if (e.key === 'Enter') startEdit(row.id, field, val) }}
                className={clsx(
                    'block w-full truncate cursor-pointer rounded px-1 py-0.5 text-sm transition-colors hover:bg-[#27272a]',
                    field === 'link_instagram' && val ? 'text-sky-400' : 'text-zinc-200'
                )}
                title="Double-click to edit"
            >
                {val || <span className="text-zinc-600 italic">—</span>}
            </span>
        )
    }

    const totalWidth = colWidths.no + 40 + colWidths.competitor + colWidths.link_instagram + colWidths.follower

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            {/* Top Bar */}
            <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] bg-[#1A1A1A] px-4 gap-3">
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                    <LayoutTemplate size={15} className="text-zinc-400" />
                    Competitors
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
                        onClick={handleAddRow}
                        className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-3 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer"
                    >
                        <Plus size={13} /> Insert Row
                    </button>
                </div>
            </div>

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
                            <col style={{ width: colWidths.link_instagram }} />
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
                                {/* No. — static, resizable */}
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
                                {renderSortHeader('Link Instagram', 'link_instagram', 'link_instagram')}
                                {renderSortHeader('Follower', 'follower', 'follower')}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-zinc-600 text-sm italic">
                                        Belum ada data. Klik &quot;Insert Row&quot; untuk menambah.
                                    </td>
                                </tr>
                            ) : (
                                sorted.map((row, idx) => (
                                    <tr
                                        key={row.id}
                                        className={clsx(
                                            'group transition-colors',
                                            selectedRows.includes(row.id) ? 'bg-dz-primary/10' : 'hover:bg-[#1e1e1e]'
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
                                        <td className="border border-[#2e2e2e] py-2 px-3 text-zinc-500 text-xs">{idx + 1}</td>
                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                            {renderCell(row, 'competitor')}
                                        </td>
                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                            {renderCell(row, 'link_instagram')}
                                        </td>
                                        <td className="border border-[#2e2e2e] py-2 px-3 text-right">
                                            {editingCell?.id === row.id && editingCell.field === 'follower' ? (
                                                <input
                                                    ref={inputRef}
                                                    type="number"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onBlur={commitEdit}
                                                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                                    className="w-full rounded bg-[#27272a] border border-dz-primary px-2 py-0.5 text-sm text-white outline-none text-right"
                                                />
                                            ) : (
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onDoubleClick={() => startEdit(row.id, 'follower', row.follower)}
                                                    onKeyDown={e => { if (e.key === 'Enter') startEdit(row.id, 'follower', row.follower) }}
                                                    className="block w-full text-right cursor-pointer rounded px-1 py-0.5 text-sm font-mono text-zinc-300 transition-colors hover:bg-[#27272a]"
                                                    title="Double-click to edit"
                                                >
                                                    {formatFollower(row.follower)}
                                                </span>
                                            )}
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
                {rows.length} data • Double-click sel untuk mengedit
            </div>
        </div>
    )
}
