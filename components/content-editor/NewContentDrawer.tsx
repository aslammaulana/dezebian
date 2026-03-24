'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ContentStatus, Priority, ContentTable } from '@/lib/types'

const STATUS_OPTIONS: ContentStatus[] = ['idea', 'draft', 'on-production', 'edited', 'need-review', 'approved', 'published']
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Med', 'High']

interface NewContentDrawerProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { topic: string; status: ContentStatus; priority: Priority; table_id: string; sprint_id?: string | null }) => void
    activeTable: ContentTable | undefined
    sprintTables: ContentTable[]
}

export function NewContentDrawer({ isOpen, onClose, onSubmit, activeTable, sprintTables }: NewContentDrawerProps) {
    const [topic, setTopic] = useState('')
    const [status, setStatus] = useState<ContentStatus>('idea')
    const [priority, setPriority] = useState<Priority>('Med')
    const [sprintId, setSprintId] = useState<string>('')

    const handleSubmit = () => {
        if (!topic.trim() || !activeTable) return
        onSubmit({
            topic: topic.trim(),
            status,
            priority,
            table_id: activeTable.id,
            sprint_id: sprintId || null,
        })
        setTopic('')
        setStatus('idea')
        setPriority('Med')
        setSprintId('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-[#1A1A1A] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-md z-10 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-white">New Content</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Topik */}
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Topik / Judul <span className="text-red-400">*</span></label>
                        <input
                            autoFocus
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                            placeholder="Judul konten..."
                            className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Status */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as ContentStatus)}
                                className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors cursor-pointer"
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Prioritas</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as Priority)}
                                className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors cursor-pointer"
                            >
                                {PRIORITY_OPTIONS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sprint */}
                    {sprintTables.length > 0 && (
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Sprint</label>
                            <select
                                value={sprintId}
                                onChange={e => setSprintId(e.target.value)}
                                className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors cursor-pointer"
                            >
                                <option value="">— Tidak ada sprint —</option>
                                {sprintTables.map(t => (
                                    <option key={t.id} value={t.id}>{t.title || `Sprint ${t.sprint_number}`}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!topic.trim()}
                            className="px-4 py-2 rounded-lg bg-dz-primary text-sm text-white hover:bg-[#007042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
