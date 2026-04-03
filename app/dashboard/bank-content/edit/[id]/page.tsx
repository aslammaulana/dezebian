'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2, Check, Eye } from 'lucide-react'
import clsx from 'clsx'
import { BankContent, BankContentStatus } from '@/lib/types'
import { PopoverSelect } from '@/components/ui/PopoverSelect'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_OPTIONS: BankContentStatus[] = ['Draft', 'Development', 'Need Review', 'Published']

const STATUS_COLORS: Record<string, string> = {
    'Draft': 'text-zinc-400 bg-zinc-400',
    'Development': 'text-blue-500 bg-blue-500',
    'Need Review': 'text-orange-500 bg-orange-500',
    'Published': 'text-green-500 bg-green-500',
}

// ─── Field Helpers ────────────────────────────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[#27272a] flex flex-col bg-[#1a1a1a]">
            <div className="px-5 py-3 border-b border-[#27272a] bg-[#141414] rounded-t-xl">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    )
}

function TextField({ label, value, onChange, placeholder, disabled, wide }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; wide?: boolean
}) {
    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    )
}

function TextareaField({ label, value, onChange, placeholder, rows = 5, disabled, wide }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; disabled?: boolean; wide?: boolean
}) {
    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BankContentEditPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const [form, setForm] = useState<Partial<BankContent>>({
        topik_masalah: '',
        status: 'Draft',
        hook: '',
        penyebab: '',
        solusi: '',
        fitur_unggulan: '',
        cta: '',
        ai_style: '',
        vo_script: '',
        caption: '',
    })

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/bank-content/${id}`)
                if (!res.ok) throw new Error('Not found')
                const content: BankContent = await res.json()
                // Populate form, converting null → ''
                const populated: Partial<BankContent> = {}
                for (const key of Object.keys(form)) {
                    populated[key as keyof BankContent] = (content[key as keyof BankContent] ?? '') as any
                }
                setForm(populated)
            } catch (err) {
                console.error(err)
                router.push('/dashboard/bank-content')
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [id])

    const set = (field: keyof BankContent) => (value: string) => {
        // status & topik_masalah tidak boleh null (NOT NULL di DB)
        if ((field === 'status' || field === 'topik_masalah') && !value) return
        setForm(prev => ({ ...prev, [field]: value || null }))
    }

    const str = (field: keyof BankContent): string => String(form[field] || '')

    const handleSave = async () => {
        if (!str('topik_masalah').trim()) return
        setIsSaving(true)
        try {
            // Strip meta fields — hanya kirim kolom yang bisa diupdate
            const { id: _id, created_at: _ca, ...payload } = form as BankContent
            const res = await fetch(`/api/bank-content/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Failed to save')
            setSaved(true)
            setTimeout(() => router.push('/dashboard/bank-content'), 1200)
        } catch (err) {
            console.error(err)
            setSaved(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Hapus konten ini? Tindakan ini tidak bisa dibatalkan.')) return
        const res = await fetch(`/api/bank-content/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            console.error('Delete failed')
            return
        }
        router.push('/dashboard/bank-content')
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dz-background">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            {/* Top Bar */}
            <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] bg-[#1A1A1A] px-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/dashboard/bank-content')}
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <span className="text-zinc-600">/</span>
                    <span className="text-sm text-white font-medium truncate">
                        {str('topik_masalah') || 'Untitled'}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => router.push(`/dashboard/bank-content/view/${id}`)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Eye size={13} /> View
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={13} /> Hapus
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={clsx(
                            'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
                            saved ? 'bg-green-600 text-white' : 'bg-dz-primary text-white hover:bg-[#007042]'
                        )}
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
                        {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
                <div className="w-full flex flex-col gap-5">

                    {/* [Utama] */}
                    <FormSection title="Utama">
                        <TextField
                            label="Topik Masalah"
                            value={str('topik_masalah')}
                            onChange={set('topik_masalah')}
                            placeholder="Topik masalah konten..."
                            disabled={isSaving}
                            wide
                        />
                        <div className="md:col-span-2">
                            <PopoverSelect
                                label="Status"
                                value={str('status')}
                                onChange={set('status')}
                                options={STATUS_OPTIONS as unknown as string[]}
                                colorMap={STATUS_COLORS}
                                disabled={isSaving}
                            />
                        </div>
                        <TextareaField label="Hook" value={str('hook')} onChange={set('hook')} placeholder="Hook pembuka konten..." rows={5} disabled={isSaving} />
                        <TextareaField label="Penyebab" value={str('penyebab')} onChange={set('penyebab')} placeholder="Akar masalah / penyebab..." rows={5} disabled={isSaving} />
                        <TextareaField label="Solusi" value={str('solusi')} onChange={set('solusi')} placeholder="Solusi yang ditawarkan..." rows={5} disabled={isSaving} />
                        <TextareaField label="Fitur Unggulan" value={str('fitur_unggulan')} onChange={set('fitur_unggulan')} placeholder="Fitur unggulan yang ditonjolkan..." rows={5} disabled={isSaving} />
                        <TextareaField label="CTA" value={str('cta')} onChange={set('cta')} placeholder="Call to action..." rows={4} disabled={isSaving} wide />
                    </FormSection>

                    {/* [Additional Card] */}
                    <FormSection title="Additional Card">
                        <TextareaField label="AI Style" value={str('ai_style')} onChange={set('ai_style')} placeholder="Gaya penulisan AI..." rows={12} disabled={isSaving} />
                        <TextareaField label="VO Script" value={str('vo_script')} onChange={set('vo_script')} placeholder="Script voiceover..." rows={12} disabled={isSaving} />
                        <TextareaField label="Caption" value={str('caption')} onChange={set('caption')} placeholder="Caption untuk postingan..." rows={10} disabled={isSaving} />
                    </FormSection>

                </div>
            </div>
        </div>
    )
}
