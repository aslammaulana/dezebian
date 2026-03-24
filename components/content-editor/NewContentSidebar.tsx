'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { ContentStatus, Priority, ContentTable } from '@/lib/types'
import { PopoverSelect } from '@/components/ui/PopoverSelect'

// ─── Static options ─────────────────────────────────────────────────────────
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

// ─── Main Sidebar ────────────────────────────────────────────────────────────
interface NewContentSidebarProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { topic: string; status: ContentStatus; priority: Priority; table_id: string; sprint_id?: string | null; format?: string; content_type?: string; funnel?: string; section?: string }) => Promise<void>
    activeTable: ContentTable | undefined
    sprintTables: ContentTable[]
}

export function NewContentSidebar({ isOpen, onClose, onSubmit, activeTable, sprintTables }: NewContentSidebarProps) {
    const [topic, setTopic] = useState('')
    const [status, setStatus] = useState<ContentStatus>('idea')
    const [priority, setPriority] = useState<Priority>('Med')
    const [format, setFormat] = useState('')
    const [contentType, setContentType] = useState('')
    const [funnel, setFunnel] = useState('')
    const [section, setSection] = useState('')
    const [sprintId, setSprintId] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)

    // Dynamic options
    const [dynOpts, setDynOpts] = useState<Record<string, string[]>>({
        format: [], content_type: [], section: [], funnel: [],
    })

    useEffect(() => {
        if (!isOpen) return
        fetch('/api/select-options')
            .then(r => r.ok ? r.json() : [])
            .then((all: SelectOptionItem[]) => {
                const g: Record<string, string[]> = { format: [], content_type: [], section: [], funnel: [] }
                for (const o of all) {
                    if (g[o.category] !== undefined) g[o.category].push(o.label || o.value)
                }
                setDynOpts(g)
            })
    }, [isOpen])

    const reset = () => {
        setTopic(''); setStatus('idea'); setPriority('Med'); setFormat(''); setContentType('');
        setFunnel(''); setSection(''); setSprintId('')
    }

    const handleClose = () => { reset(); onClose() }

    const handleSubmit = async () => {
        if (!topic.trim() || !activeTable) return
        setIsSaving(true)
        try {
            await onSubmit({
                topic: topic.trim(),
                status,
                priority,
                table_id: activeTable.id,
                sprint_id: sprintId || null,
                format: format || undefined,
                content_type: contentType || undefined,
                funnel: funnel || undefined,
                section: section || undefined,
            })
            reset()
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    // Sprint options: use table title
    const sprintOptions = sprintTables.map(t => t.title || `Sprint ${t.sprint_number}`)
    const sprintIdByLabel = Object.fromEntries(sprintTables.map(t => [t.title || `Sprint ${t.sprint_number}`, t.id]))

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={handleClose} />
            )}
            <aside className={clsx(
                'fixed right-0 top-0 z-50 h-screen w-full max-w-[400px] flex flex-col bg-[#161616] border-l border-[#27272a] shadow-2xl transition-transform duration-300 ease-in-out',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="flex h-[50px] shrink-0 items-center justify-between px-5 border-b border-[#27272a]">
                    <h2 className="text-sm font-semibold text-white">New Content</h2>
                    <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                {/* Form body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
                    <div className="flex flex-col gap-5">

                        {/* Topik */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Topik / Judul <span className="text-red-400">*</span></label>
                            <input
                                autoFocus
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit() }}
                                placeholder="Judul konten..."
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors"
                            />
                        </div>

                        {/* Status */}
                        <PopoverSelect
                            label="Status"
                            value={status}
                            onChange={v => setStatus((v || 'idea') as ContentStatus)}
                            options={STATUS_OPTIONS as unknown as string[]}
                            colorMap={STATUS_COLORS}
                        />

                        {/* Prioritas */}
                        <PopoverSelect
                            label="Prioritas"
                            value={priority}
                            onChange={v => setPriority((v || 'Med') as Priority)}
                            options={PRIORITY_OPTIONS as unknown as string[]}
                            colorMap={PRIORITY_COLORS}
                        />

                        {/* Format */}
                        <PopoverSelect
                            label="Format"
                            value={format}
                            onChange={setFormat}
                            options={dynOpts.format}
                        />

                        {/* Tipe Konten */}
                        <PopoverSelect
                            label="Tipe Konten"
                            value={contentType}
                            onChange={setContentType}
                            options={dynOpts.content_type}
                        />

                        {/* Funnel */}
                        <PopoverSelect
                            label="Tujuan / Funnel"
                            value={funnel}
                            onChange={setFunnel}
                            options={dynOpts.funnel}
                        />

                        {/* Section */}
                        <PopoverSelect
                            label="Section"
                            value={section}
                            onChange={setSection}
                            options={dynOpts.section}
                        />

                        {/* Sprint */}
                        <PopoverSelect
                            label="Sprint"
                            value={sprintId ? (sprintTables.find(t => t.id === sprintId)?.title || '') : ''}
                            onChange={v => setSprintId(v ? (sprintIdByLabel[v] || '') : '')}
                            options={sprintOptions}
                            placeholder="— Tidak ada sprint —"
                        />

                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-5 border-t border-[#27272a]">
                    <button
                        onClick={handleClose}
                        className="flex-1 rounded-lg border border-[#3a3a3a] py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!topic.trim() || isSaving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dz-primary py-2.5 text-sm font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isSaving ? 'Saving...' : 'Create Content'}
                    </button>
                </div>
            </aside>
        </>
    )
}
