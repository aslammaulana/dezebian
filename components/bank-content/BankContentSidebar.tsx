'use client'

import { useState } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { BankContentStatus } from '@/lib/types'
import { PopoverSelect } from '@/components/ui/PopoverSelect'

const STATUS_OPTIONS: BankContentStatus[] = ['Draft', 'Development', 'Need Review', 'Published']

const STATUS_COLORS: Record<string, string> = {
    'Draft': 'text-zinc-400 bg-zinc-400',
    'Development': 'text-blue-500 bg-blue-500',
    'Need Review': 'text-orange-500 bg-orange-500',
    'Published': 'text-green-500 bg-green-500',
}

interface BankContentSidebarProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: {
        topik_masalah: string
        status: BankContentStatus
        hook?: string
        penyebab?: string
        solusi?: string
        fitur_unggulan?: string
        cta?: string
    }) => Promise<void>
}

export function BankContentSidebar({ isOpen, onClose, onSubmit }: BankContentSidebarProps) {
    const [topikMasalah, setTopikMasalah] = useState('')
    const [status, setStatus] = useState<BankContentStatus>('Draft')
    const [hook, setHook] = useState('')
    const [penyebab, setPenyebab] = useState('')
    const [solusi, setSolusi] = useState('')
    const [fiturUnggulan, setFiturUnggulan] = useState('')
    const [cta, setCta] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const reset = () => {
        setTopikMasalah('')
        setStatus('Draft')
        setHook('')
        setPenyebab('')
        setSolusi('')
        setFiturUnggulan('')
        setCta('')
    }

    const handleClose = () => { reset(); onClose() }

    const handleSubmit = async () => {
        if (!topikMasalah.trim()) return
        setIsSaving(true)
        try {
            await onSubmit({
                topik_masalah: topikMasalah.trim(),
                status,
                hook: hook || undefined,
                penyebab: penyebab || undefined,
                solusi: solusi || undefined,
                fitur_unggulan: fiturUnggulan || undefined,
                cta: cta || undefined,
            })
            reset()
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={handleClose} />
            )}
            <aside className={clsx(
                'fixed right-0 top-0 z-50 h-screen w-full max-w-[420px] flex flex-col bg-[#161616] border-l border-[#27272a] shadow-2xl transition-transform duration-300 ease-in-out',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="flex h-[50px] shrink-0 items-center justify-between px-5 border-b border-[#27272a]">
                    <h2 className="text-sm font-semibold text-white">New Bank Content</h2>
                    <button
                        onClick={handleClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
                    <div className="flex flex-col gap-4">

                        {/* Topik Masalah */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">
                                Topik Masalah <span className="text-red-400">*</span>
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={topikMasalah}
                                onChange={e => setTopikMasalah(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit() }}
                                placeholder="Topik masalah konten..."
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors"
                            />
                        </div>

                        {/* Status */}
                        <PopoverSelect
                            label="Status"
                            value={status}
                            onChange={v => setStatus((v || 'Draft') as BankContentStatus)}
                            options={STATUS_OPTIONS as unknown as string[]}
                            colorMap={STATUS_COLORS}
                        />

                        {/* Hook */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Hook</label>
                            <textarea
                                value={hook}
                                onChange={e => setHook(e.target.value)}
                                placeholder="Hook pembuka konten..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y"
                            />
                        </div>

                        {/* Penyebab */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Penyebab</label>
                            <textarea
                                value={penyebab}
                                onChange={e => setPenyebab(e.target.value)}
                                placeholder="Akar masalah / penyebab..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y"
                            />
                        </div>

                        {/* Solusi */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Solusi</label>
                            <textarea
                                value={solusi}
                                onChange={e => setSolusi(e.target.value)}
                                placeholder="Solusi yang ditawarkan..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y"
                            />
                        </div>

                        {/* Fitur Unggulan */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Fitur Unggulan</label>
                            <textarea
                                value={fiturUnggulan}
                                onChange={e => setFiturUnggulan(e.target.value)}
                                placeholder="Fitur unggulan yang ditonjolkan..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y"
                            />
                        </div>

                        {/* CTA */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">CTA</label>
                            <textarea
                                value={cta}
                                onChange={e => setCta(e.target.value)}
                                placeholder="Call to action..."
                                rows={2}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y"
                            />
                        </div>

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
                        disabled={!topikMasalah.trim() || isSaving}
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
