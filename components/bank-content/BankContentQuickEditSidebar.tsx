'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Check, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import { BankContent, BankContentStatus } from '@/lib/types'
import { PopoverSelect } from '@/components/ui/PopoverSelect'

const STATUS_OPTIONS: BankContentStatus[] = ['Draft', 'Development', 'Need Review', 'Published']

const STATUS_COLORS: Record<string, string> = {
    'Draft': 'text-zinc-400 bg-zinc-400',
    'Development': 'text-blue-500 bg-blue-500',
    'Need Review': 'text-orange-500 bg-orange-500',
    'Published': 'text-green-500 bg-green-500',
}

interface BankContentQuickEditSidebarProps {
    content: BankContent | null
    onClose: () => void
    onSave: (updated: BankContent) => void
    onOpenFull: (id: string) => void
}

export function BankContentQuickEditSidebar({
    content,
    onClose,
    onSave,
    onOpenFull,
}: BankContentQuickEditSidebarProps) {
    const isOpen = content !== null

    const [topikMasalah, setTopikMasalah] = useState('')
    const [status, setStatus] = useState<BankContentStatus>('Draft')
    const [hook, setHook] = useState('')
    const [penyebab, setPenyebab] = useState('')
    const [solusi, setSolusi] = useState('')
    const [fiturUnggulan, setFiturUnggulan] = useState('')
    const [cta, setCta] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Populate when content changes
    useEffect(() => {
        if (!content) return
        setTopikMasalah(content.topik_masalah || '')
        setStatus(content.status || 'Draft')
        setHook(content.hook || '')
        setPenyebab(content.penyebab || '')
        setSolusi(content.solusi || '')
        setFiturUnggulan(content.fitur_unggulan || '')
        setCta(content.cta || '')
        setSaved(false)
    }, [content?.id])

    const handleSave = async () => {
        if (!content || !topikMasalah.trim()) return
        setIsSaving(true)
        try {
            const res = await fetch(`/api/bank-content/${content.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topik_masalah: topikMasalah.trim(),
                    status,
                    hook: hook || null,
                    penyebab: penyebab || null,
                    solusi: solusi || null,
                    fitur_unggulan: fiturUnggulan || null,
                    cta: cta || null,
                }),
            })
            if (!res.ok) throw new Error('Failed to save')
            const updated: BankContent = await res.json()
            onSave(updated)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={onClose} />
            )}
            <aside className={clsx(
                'fixed right-0 top-0 z-50 h-screen w-full max-w-[420px] flex flex-col bg-[#161616] border-l border-[#27272a] shadow-2xl transition-transform duration-300 ease-in-out',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="flex h-[50px] shrink-0 items-center justify-between px-5 border-b border-[#27272a]">
                    <h2 className="text-sm font-semibold text-white truncate pr-2">
                        {topikMasalah || 'Edit Konten'}
                    </h2>
                    <div className="flex items-center gap-1 shrink-0">
                        {content && (
                            <button
                                onClick={() => onOpenFull(content.id)}
                                title="Buka halaman edit lengkap"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                            >
                                <ExternalLink size={14} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
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
                                type="text"
                                value={topikMasalah}
                                onChange={e => setTopikMasalah(e.target.value)}
                                disabled={isSaving}
                                placeholder="Topik masalah konten..."
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Status */}
                        <PopoverSelect
                            label="Status"
                            value={status}
                            onChange={v => setStatus((v || 'Draft') as BankContentStatus)}
                            options={STATUS_OPTIONS as unknown as string[]}
                            colorMap={STATUS_COLORS}
                            disabled={isSaving}
                        />

                        {/* Hook */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Hook</label>
                            <textarea
                                value={hook}
                                onChange={e => setHook(e.target.value)}
                                disabled={isSaving}
                                placeholder="Hook pembuka konten..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Penyebab */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Penyebab</label>
                            <textarea
                                value={penyebab}
                                onChange={e => setPenyebab(e.target.value)}
                                disabled={isSaving}
                                placeholder="Akar masalah / penyebab..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Solusi */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Solusi</label>
                            <textarea
                                value={solusi}
                                onChange={e => setSolusi(e.target.value)}
                                disabled={isSaving}
                                placeholder="Solusi yang ditawarkan..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Fitur Unggulan */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">Fitur Unggulan</label>
                            <textarea
                                value={fiturUnggulan}
                                onChange={e => setFiturUnggulan(e.target.value)}
                                disabled={isSaving}
                                placeholder="Fitur unggulan yang ditonjolkan..."
                                rows={3}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* CTA */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1.5">CTA</label>
                            <textarea
                                value={cta}
                                onChange={e => setCta(e.target.value)}
                                disabled={isSaving}
                                placeholder="Call to action..."
                                rows={2}
                                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none hover:border-zinc-500 focus:border-dz-primary transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-5 border-t border-[#27272a]">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-[#3a3a3a] py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!topikMasalah.trim() || isSaving}
                        className={clsx(
                            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                            saved ? 'bg-green-600' : 'bg-dz-primary hover:bg-[#007042]'
                        )}
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                        {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </aside>
        </>
    )
}
