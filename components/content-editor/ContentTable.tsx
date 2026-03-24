'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Trash2, PanelLeftOpen, PanelLeftClose, RefreshCw, Pencil, Search, Filter, ArrowUpDown, X, ChevronsUpDown, Brain, Check } from 'lucide-react'
import clsx from 'clsx'
import type { ContentTable as ContentTableType } from '@/lib/types'
import { ReelsContent, ContentStatus, Priority } from '@/lib/types'
import { PopoverSelect } from '@/components/ui/PopoverSelect'

const STATUS_OPTIONS: ContentStatus[] = ['idea', 'draft', 'on-production', 'edited', 'need-review', 'approved', 'published']
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Med', 'High']

const STATUS_COLORS: Record<string, string> = {
    'idea': 'text-zinc-400 bg-zinc-400',
    'draft': 'text-blue-500 bg-blue-500',
    'on-production': 'text-yellow-500 bg-yellow-500',
    'edited': 'text-purple-500 bg-purple-500',
    'need-review': 'text-orange-500 bg-orange-500',
    'approved': 'text-green-500 bg-green-500',
    'published': 'text-emerald-500 bg-emerald-500',
}

const PRIORITY_COLORS: Record<string, string> = {
    'Low': 'text-blue-500 bg-blue-500',
    'Med': 'text-yellow-500 bg-yellow-500',
    'High': 'text-red-500 bg-red-500',
}

interface SelectOptionItem { id: string; category: string; value: string; label: string | null }

interface ContentTableProps {
    isSidebarOpen: boolean
    onOpenSidebar: () => void
    onCloseSidebar: () => void
    activeTable: ContentTableType
    allTables: ContentTableType[]
    contents: ReelsContent[]
    onContentsChange: (contents: ReelsContent[]) => void
    onContentUpdate: (id: string, field: string, value: string | null) => void
    onContentDelete: (ids: string[]) => void
    onInsertRow: () => void
    onRefresh?: () => void
    onViewDetail: (content: ReelsContent) => void
    onEditContent: (id: string) => void
    searchQuery?: string
}

export function ContentTable({
    isSidebarOpen,
    onOpenSidebar,
    onCloseSidebar,
    activeTable,
    allTables,
    contents,
    onContentsChange,
    onContentUpdate,
    onContentDelete,
    onInsertRow,
    onRefresh,
    onViewDetail,
    onEditContent,
    searchQuery: externalSearch = '',
}: ContentTableProps) {
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [ragSaving, setRagSaving] = useState<string | null>(null)   // row.id yang sedang disimpan
    const [ragDone, setRagDone] = useState<string | null>(null)       // row.id yang baru selesai
    const [sortField, setSortField] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    // Toolbar state (lives inside table context bar)
    const [searchOpen, setSearchOpen] = useState(false)
    const [localSearch, setLocalSearch] = useState('')

    // Dynamic options for inline editing
    const [dynOpts, setDynOpts] = useState<Record<string, string[]>>({
        format: [], content_type: [], section: [], funnel: [],
    })

    useEffect(() => {
        fetch('/api/select-options')
            .then(r => r.ok ? r.json() : [])
            .then((all: SelectOptionItem[]) => {
                const g: Record<string, string[]> = { format: [], content_type: [], section: [], funnel: [] }
                for (const o of all) {
                    if (g[o.category] !== undefined) g[o.category].push(o.label || o.value)
                }
                setDynOpts(g)
            })
    }, [])

    // Column widths
    const [colWidths, setColWidths] = useState({
        checkbox: 40,
        no: 50,
        topic: 250,
        edit: 90,
        status: 170,
        priority: 100,
        format: 150,
        content_type: 190,
        funnel: 160,
        section: 180,
        sprint: 140,
    })

    const resizingCol = useRef<string | null>(null)
    const resizeStartX = useRef(0)
    const resizeStartWidth = useRef(0)
    const theadScrollRef = useRef<HTMLDivElement>(null)
    const tbodyScrollRef = useRef<HTMLDivElement>(null)

    // Sync horizontal scroll
    useEffect(() => {
        const theadEl = theadScrollRef.current
        const tbodyEl = tbodyScrollRef.current
        if (!theadEl || !tbodyEl) return
        const syncFromBody = () => { theadEl.scrollLeft = tbodyEl.scrollLeft }
        const syncFromHead = () => { tbodyEl.scrollLeft = theadEl.scrollLeft }
        tbodyEl.addEventListener('scroll', syncFromBody)
        theadEl.addEventListener('scroll', syncFromHead)
        return () => { tbodyEl.removeEventListener('scroll', syncFromBody); theadEl.removeEventListener('scroll', syncFromHead) }
    }, [])

    const handleResizeStart = useCallback((e: React.MouseEvent, colKey: string) => {
        e.preventDefault(); e.stopPropagation()
        resizingCol.current = colKey
        resizeStartX.current = e.clientX
        resizeStartWidth.current = colWidths[colKey as keyof typeof colWidths]
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [colWidths])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingCol.current) return
            const delta = e.clientX - resizeStartX.current
            const newWidth = Math.max(60, resizeStartWidth.current + delta)
            setColWidths(prev => ({ ...prev, [resizingCol.current!]: newWidth }))
        }
        const handleMouseUp = () => {
            if (resizingCol.current) { resizingCol.current = null; document.body.style.cursor = ''; document.body.style.userSelect = '' }
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp) }
    }, [])

    // Filter by active table
    const tableContents = activeTable
        ? contents.filter(c => c.table_id === activeTable.id)
        : contents

    // Search — external beats local
    const activeSearch = externalSearch || localSearch
    let filtered = activeSearch.trim()
        ? tableContents.filter(c => c.topic.toLowerCase().includes(activeSearch.toLowerCase()))
        : tableContents

    // Sort
    if (sortField) {
        filtered = [...filtered].sort((a, b) => {
            const aVal = String(a[sortField as keyof ReelsContent] ?? '')
            const bVal = String(b[sortField as keyof ReelsContent] ?? '')
            const cmp = aVal.localeCompare(bVal)
            return sortDir === 'asc' ? cmp : -cmp
        })
    }

    const getSprintLabel = (sprintId: string | null | undefined) => {
        if (!sprintId) return '—'
        const t = allTables.find(t => t.id === sprintId)
        return t ? (t.title || `Sprint ${t.sprint_number}`) : '—'
    }

    const toggleSelectAll = () => {
        setSelectedRows(selectedRows.length === filtered.length ? [] : filtered.map(c => c.id))
    }

    const toggleRow = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleDelete = () => {
        onContentDelete(selectedRows)
        onContentsChange(contents.filter(c => !selectedRows.includes(c.id)))
        setSelectedRows([])
    }

    const handleRefresh = async () => {
        if (!onRefresh || isRefreshing) return
        setIsRefreshing(true)
        try { await onRefresh() } finally { setIsRefreshing(false) }
    }

    const handleSendToRag = async (row: ReelsContent) => {
        setRagSaving(row.id)
        try {
            const lines: string[] = []
            const add = (label: string, val?: string | null) => { if (val?.trim()) lines.push(`${label}: ${val.trim()}`) }

            add('Topik', row.topic)
            add('Produk', row.product_name)
            add('Tanggal Posting', row.posting_date)
            add('Status', row.status)
            add('Format', row.format)
            add('Hook', row.hook)
            add('Priority', row.priority)
            add('Content Type', row.content_type)
            add('Section', row.section)
            add('Sub Section', row.sub_section)
            add('Target Audience', row.target_audience)
            add('Funnel', row.funnel)
            add('Offer Status', row.offer_status)
            add('Brand', row.brand)
            add('Visual Link', row.visual_link)
            add('Visual Description', row.visual_description)
            add('Attention (AIDA)', row.attention)
            add('Interest (AIDA)', row.interest)
            add('Desire (AIDA)', row.desire)
            add('Action (AIDA)', row.action)
            add('Voiceover Script', row.voiceover_script)
            add('Caption', row.caption)
            add('Hashtag', row.hashtag)
            add('Audio', row.audio)
            add('Reference Link', row.reference_link)
            add('Location', row.location)

            const title = `[Reels] ${row.topic || 'Untitled'}`
            const context = lines.join('\n')

            const res = await fetch('/api/knowledge/save-rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, context }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Gagal menyimpan RAG')
            }
            setRagDone(row.id)
            setTimeout(() => setRagDone(null), 2500)
        } catch (err: any) {
            alert('Gagal kirim ke RAG: ' + err.message)
        } finally {
            setRagSaving(null)
        }
    }

    const handleSortToggle = (field: string) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('asc') }
    }

    const toggleSearch = () => {
        if (searchOpen) { setLocalSearch('') }
        setSearchOpen(prev => !prev)
    }

    const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0)

    const renderResizer = (colKey: string) => (
        <div
            onMouseDown={e => handleResizeStart(e, colKey)}
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-dz-primary/50 transition-colors z-20"
        />
    )

    const renderSortHeader = (label: string, field: string) => (
        <button
            onClick={() => handleSortToggle(field)}
            className={clsx('flex items-center gap-1.5 cursor-pointer transition-colors uppercase', sortField === field ? 'text-dz-primary' : 'text-zinc-500 hover:text-zinc-300')}
        >
            {label}
            <ChevronsUpDown size={12} className={clsx('shrink-0 transition-transform', sortField === field && sortDir === 'desc' ? 'rotate-180' : '')} />
        </button>
    )

    return (
        <div className="flex h-full w-full flex-col bg-dz-background text-sm text-zinc-300">
            {/* Context bar — with sidebar toggle, table name, toolbar and actions */}
            <div className="flex items-center justify-between border-b border-[#27272a] min-h-[50px] bg-[#1A1A1A]">
                {selectedRows.length > 0 ? (
                    <div className="flex items-center gap-4 px-2 w-full z-10">
                        <button onClick={handleDelete} className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer">
                            <Trash2 size={14} /> Delete {selectedRows.length} selected
                        </button>
                        <span className="text-xs text-zinc-500">{selectedRows.length} selected</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-0 w-full overflow-hidden">
                        {/* Sidebar toggle */}
                        <button
                            onClick={isSidebarOpen ? onCloseSidebar : onOpenSidebar}
                            className="flex items-center justify-center p-4 text-zinc-400 hover:text-white hover:bg-[#222] transition-colors border-r border-[#27272a] cursor-pointer shrink-0"
                        >
                            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                        </button>

                        {/* Active table label */}
                        <div className="flex items-center gap-2 border-t-2 border-white px-4 py-3 bg-[#1A1A1A] shrink-0">
                            <span className="text-sm font-medium text-white">{activeTable?.title || 'Tasks'}</span>
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-400">{filtered.length}</span>
                        </div>

                        {/* ─── Toolbar: Filter · Sort · Search ─── */}
                        <div className="flex items-center gap-1.5 px-2 ml-2">
                            <button
                                className="flex items-center gap-1.5 rounded-lg border border-[#3a3a3a] px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                            >
                                <Filter size={11} /> Filter
                            </button>
                            <button
                                onClick={() => { if (sortField) { setSortField(null) } }}
                                className={clsx(
                                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                                    sortField
                                        ? 'border-dz-primary bg-dz-primary/10 text-dz-primary'
                                        : 'border-[#3a3a3a] text-zinc-400 hover:border-zinc-500 hover:text-white'
                                )}
                            >
                                <ArrowUpDown size={11} /> Sort
                                {sortField && <span className="text-[10px] opacity-70">({sortField})</span>}
                            </button>
                            <button
                                onClick={toggleSearch}
                                className={clsx(
                                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                                    searchOpen
                                        ? 'border-dz-primary bg-dz-primary/10 text-dz-primary'
                                        : 'border-[#3a3a3a] text-zinc-400 hover:border-zinc-500 hover:text-white'
                                )}
                            >
                                <Search size={11} />
                                {!searchOpen && 'Search'}
                            </button>
                            {/* Expanding search input */}
                            <div className={clsx(
                                'flex items-center gap-1 overflow-hidden transition-all duration-200',
                                searchOpen ? 'w-44 opacity-100' : 'w-0 opacity-0'
                            )}>
                                <input
                                    autoFocus={searchOpen}
                                    type="text"
                                    value={localSearch}
                                    onChange={e => setLocalSearch(e.target.value)}
                                    placeholder="Cari topik..."
                                    className="w-full h-7 rounded-lg bg-[#27272a] px-3 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-dz-primary"
                                />
                                {localSearch && (
                                    <button onClick={() => setLocalSearch('')} className="shrink-0 text-zinc-500 hover:text-white cursor-pointer">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Actions: Refresh + New */}
                        <div className="ml-auto flex items-center gap-1 pr-3 shrink-0">
                            <button onClick={handleRefresh} className={clsx('flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer', isRefreshing && 'animate-spin')}>
                                <RefreshCw size={14} />
                            </button>
                            <button onClick={onInsertRow} className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-3 py-1.5 text-xs text-white hover:bg-[#007042] transition-colors cursor-pointer">
                                <Plus size={13} /> Insert Row
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Thead scroll container */}
                <div ref={theadScrollRef} className="shrink-0 overflow-x-auto overflow-y-hidden scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    <table className="border-collapse text-left" style={{ tableLayout: 'fixed', width: totalWidth }}>
                        <colgroup>
                            <col style={{ width: colWidths.checkbox }} />
                            <col style={{ width: colWidths.no }} />
                            <col style={{ width: colWidths.topic }} />
                            <col style={{ width: colWidths.edit }} />
                            <col style={{ width: colWidths.status }} />
                            <col style={{ width: colWidths.priority }} />
                            <col style={{ width: colWidths.format }} />
                            <col style={{ width: colWidths.content_type }} />
                            <col style={{ width: colWidths.funnel }} />
                            <col style={{ width: colWidths.section }} />
                            <col style={{ width: colWidths.sprint }} />
                        </colgroup>
                        <thead className="bg-[#1A1A1A] text-xs font-semibold uppercase text-zinc-500">
                            <tr>
                                <th className="border border-[#2e2e2e] py-2 px-3 text-center">
                                    <input type="checkbox" className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 focus:ring-0 focus:ring-offset-0" checked={selectedRows.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} />
                                </th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">NO.{renderResizer('no')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('TOPIK', 'topic')}{renderResizer('topic')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative text-center uppercase">EDIT{renderResizer('edit')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('STATUS', 'status')}{renderResizer('status')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('PRIORITY', 'priority')}{renderResizer('priority')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('FORMAT', 'format')}{renderResizer('format')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('CONTENT TYPE', 'content_type')}{renderResizer('content_type')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('FUNNEL', 'funnel')}{renderResizer('funnel')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('SECTION', 'section')}{renderResizer('section')}</th>
                                <th className="border border-[#2e2e2e] py-2 px-3 relative uppercase">{renderSortHeader('SPRINT', 'sprint_id')}{renderResizer('sprint')}</th>
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Tbody scroll container */}
                <div ref={tbodyScrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin">
                    <table className="border-collapse text-left" style={{ tableLayout: 'fixed', width: totalWidth }}>
                        <colgroup>
                            <col style={{ width: colWidths.checkbox }} />
                            <col style={{ width: colWidths.no }} />
                            <col style={{ width: colWidths.topic }} />
                            <col style={{ width: colWidths.edit }} />
                            <col style={{ width: colWidths.status }} />
                            <col style={{ width: colWidths.priority }} />
                            <col style={{ width: colWidths.format }} />
                            <col style={{ width: colWidths.content_type }} />
                            <col style={{ width: colWidths.funnel }} />
                            <col style={{ width: colWidths.section }} />
                            <col style={{ width: colWidths.sprint }} />
                        </colgroup>
                        <tbody className="divide-y divide-[#2e2e2e] bg-[#121212]">
                            {filtered.map((row, index) => {
                                const sprintOptions = allTables.filter(t => t.type === 'sprint').map(t => t.title || `Sprint ${t.sprint_number}`)
                                const sprintIdByLabel = Object.fromEntries(allTables.filter(t => t.type === 'sprint').map(t => [t.title || `Sprint ${t.sprint_number}`, t.id]))

                                return (
                                    <tr key={row.id} className={clsx('hover:bg-[#1a1a1a] transition-colors group', selectedRows.includes(row.id) && 'bg-[#1d2a20]')}>
                                        <td className="border border-[#2e2e2e] py-2 px-3 text-center">
                                            <input type="checkbox" className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 focus:ring-0 focus:ring-offset-0" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} />
                                        </td>
                                        <td className="border border-[#2e2e2e] py-2 px-3 text-zinc-500 text-xs">{index + 1}</td>
                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                            <button
                                                onClick={() => onViewDetail(row)}
                                                className="text-left w-full truncate text-white hover:underline transition-colors text-sm font-medium cursor-pointer"
                                            >
                                                {row.topic || <span className="text-zinc-600 font-normal italic">Untitled</span>}
                                            </button>
                                        </td>
                                        <td className="border border-[#2e2e2e] py-2 px-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => onEditContent(row.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-sm bg-[#27272a] px-2.5 py-1 text-xs text-zinc-300 hover:bg-dz-primary hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <Pencil size={11} /> EDIT
                                                </button>
                                                <button
                                                    onClick={() => handleSendToRag(row)}
                                                    disabled={ragSaving === row.id}
                                                    title="Kirim ke Knowledge Base (RAG)"
                                                    className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${ragDone === row.id
                                                            ? 'bg-dz-primary/20 text-dz-primary'
                                                            : 'bg-[#1e1e1e] text-zinc-500 hover:bg-dz-primary/20 hover:text-dz-primary border border-[#2e2e2e]'
                                                        }`}
                                                >
                                                    {ragDone === row.id
                                                        ? <><Check size={10} /> RAG</>
                                                        : ragSaving === row.id
                                                            ? <RefreshCw size={10} className="animate-spin" />
                                                            : <><Brain size={10} /> RAG</>
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={row.status}
                                                options={STATUS_OPTIONS as unknown as string[]}
                                                onChange={v => onContentUpdate(row.id, 'status', v || 'idea')}
                                                colorMap={STATUS_COLORS}
                                            />
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={row.priority}
                                                options={PRIORITY_OPTIONS as unknown as string[]}
                                                onChange={v => onContentUpdate(row.id, 'priority', v || 'Med')}
                                                colorMap={PRIORITY_COLORS}
                                            />
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={row.format || ''}
                                                placeholder="—"
                                                options={dynOpts.format}
                                                onChange={v => onContentUpdate(row.id, 'format', v || null)}
                                            />
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={row.content_type || ''}
                                                placeholder="—"
                                                options={dynOpts.content_type}
                                                onChange={v => onContentUpdate(row.id, 'content_type', v || null)}
                                            />
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={row.funnel || ''}
                                                placeholder="—"
                                                options={dynOpts.funnel}
                                                onChange={v => onContentUpdate(row.id, 'funnel', v || null)}
                                            />
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={row.section || ''}
                                                placeholder="—"
                                                options={dynOpts.section}
                                                onChange={v => onContentUpdate(row.id, 'section', v || null)}
                                            />
                                        </td>
                                        <td className="border border-[#2e2e2e] p-3">
                                            <PopoverSelect
                                                variant="inline"
                                                value={getSprintLabel(row.sprint_id)}
                                                placeholder="—"
                                                options={sprintOptions}
                                                onChange={v => {
                                                    const id = sprintIdByLabel[v]
                                                    onContentUpdate(row.id, 'sprint_id', id ? id : null)
                                                }}
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                            {/* Empty add row */}
                            <tr onClick={onInsertRow} className="hover:bg-[#1f1f1f] transition-colors cursor-pointer group/add">
                                <td className="border border-[#2e2e2e] py-2 px-3 text-center opacity-50 group-hover/add:opacity-100 text-zinc-500">+</td>
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3 text-zinc-600 group-hover/add:text-zinc-400 text-xs">Click to add a new content...</td>
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                                <td className="border border-[#2e2e2e] py-2 px-3" />
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
