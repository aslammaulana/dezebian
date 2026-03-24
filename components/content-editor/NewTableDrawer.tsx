'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface NewTableDrawerProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (label: string) => void
    nextSprintNumber: number
}

export function NewTableDrawer({ isOpen, onClose, onSubmit, nextSprintNumber }: NewTableDrawerProps) {
    const [label, setLabel] = useState('')

    const handleSubmit = () => {
        onSubmit(label.trim() || `Sprint ${nextSprintNumber}`)
        setLabel('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-[#1A1A1A] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-sm z-10 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white">New Table / Sprint</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">Label (opsional)</label>
                        <input
                            autoFocus
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                            placeholder={`Sprint ${nextSprintNumber}`}
                            className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-dz-primary text-sm text-white hover:bg-[#007042] transition-colors cursor-pointer">
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
