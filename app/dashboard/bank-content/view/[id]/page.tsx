'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Loader2, Copy, Check, ClipboardList } from 'lucide-react'
import clsx from 'clsx'
import { BankContent, BankContentStatus } from '@/lib/types'

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<BankContentStatus, string> = {
    'Draft': 'text-zinc-400 bg-zinc-800 border-zinc-700',
    'Development': 'text-blue-400 bg-blue-900/40 border-blue-800',
    'Need Review': 'text-orange-400 bg-orange-900/40 border-orange-800',
    'Published': 'text-green-400 bg-green-900/40 border-green-800',
}

// ─── Field Card (semua dengan tombol Salin) ────────────────────────────────────
function FieldCard({ label, value, className }: {
    label: string; value?: string | null; className?: string
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (!value) return
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={clsx('rounded-lg border border-[#27272a] bg-[#1a1a1a] flex flex-col', className)}>
            <div className="px-4 py-2 border-b border-[#27272a] bg-[#141414] rounded-t-lg flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
                {value && (
                    <button
                        onClick={handleCopy}
                        className={clsx(
                            'flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-colors cursor-pointer',
                            copied
                                ? 'text-green-400 bg-green-900/30'
                                : 'text-zinc-500 hover:text-white hover:bg-[#2a2a2a]'
                        )}
                    >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? 'Tersalin!' : 'Salin'}
                    </button>
                )}
            </div>
            <div className="px-4 py-3 flex-1">
                {value ? (
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{value}</p>
                ) : (
                    <p className="text-sm text-zinc-600 italic">—</p>
                )}
            </div>
        </div>
    )
}

// ─── Copy All helper ─────────────────────────────────────────────────────────
function buildCopyAllText(c: BankContent): string {
    const line = (label: string, val?: string | null) =>
        val ? `**${label}:**\n${val}` : null

    const utama = [
        line('Topik Masalah', c.topik_masalah),
        line('Hook', c.hook),
        line('Penyebab', c.penyebab),
        line('Solusi', c.solusi),
        line('Fitur Unggulan', c.fitur_unggulan),
        line('CTA', c.cta),
    ].filter(Boolean).join('\n')

    const additional = [
        line('VO AI Style', c.ai_style),
        line('Caption', c.caption),
        line('VO Script', c.vo_script),
    ].filter(Boolean).join('\n')

    return [utama, additional].filter(Boolean).join('\n\n---\n\n')
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BankContentViewPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [content, setContent] = useState<BankContent | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [copiedAll, setCopiedAll] = useState(false)

    useEffect(() => {
        const load = async () => {
            // Cek cache sessionStorage dulu — tampil instan
            try {
                const cached = sessionStorage.getItem(`bank_content_${id}`)
                if (cached) {
                    setContent(JSON.parse(cached))
                    setIsLoading(false)
                }
            } catch { }

            // Fetch fresh di background (silent refresh)
            try {
                const res = await fetch(`/api/bank-content/${id}`)
                if (!res.ok) throw new Error('Not found')
                const fresh: BankContent = await res.json()
                setContent(fresh)
                // Update cache
                try { sessionStorage.setItem(`bank_content_${id}`, JSON.stringify(fresh)) } catch { }
            } catch (err) {
                console.error(err)
                // Hanya redirect jika belum ada data cache
                if (!content) router.push('/dashboard/bank-content')
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [id])

    const handleCopyAll = () => {
        if (!content) return
        navigator.clipboard.writeText(buildCopyAllText(content))
        setCopiedAll(true)
        setTimeout(() => setCopiedAll(false), 2000)
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dz-background">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        )
    }

    if (!content) return null

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
                        {content.topik_masalah || 'Untitled'}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Copy All */}
                    <button
                        onClick={handleCopyAll}
                        className={clsx(
                            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                            copiedAll
                                ? 'text-green-400 bg-green-900/30'
                                : 'text-zinc-400 border border-[#3a3a3a] hover:text-white hover:border-zinc-500'
                        )}
                    >
                        {copiedAll ? <Check size={13} /> : <ClipboardList size={13} />}
                        {copiedAll ? 'Tersalin!' : 'Copy All'}
                    </button>

                    {/* Edit */}
                    <button
                        onClick={() => router.push(`/dashboard/bank-content/edit/${id}`)}
                        className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer"
                    >
                        <Pencil size={13} /> Edit
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
                <div className="w-full flex flex-col gap-6">

                    {/* Title + Status */}
                    <div className="flex flex-col gap-3">
                        <h1 className="text-2xl font-bold text-white leading-tight">
                            {content.topik_masalah || 'Untitled'}
                        </h1>
                        <span className={clsx(
                            'self-start inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
                            STATUS_BADGE[content.status] || STATUS_BADGE['Draft']
                        )}>
                            {content.status}
                        </span>
                    </div>

                    {/* Row 1: Hook | Penyebab | Solusi */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldCard label="Hook" value={content.hook} />
                        <FieldCard label="Penyebab" value={content.penyebab} />
                        <FieldCard label="Solusi" value={content.solusi} />
                    </div>

                    {/* Row 2: Fitur Unggulan | CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldCard label="Fitur Unggulan" value={content.fitur_unggulan} />
                        <FieldCard label="CTA" value={content.cta} />
                    </div>

                    {/* Row 3: AI Style | VO Script */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldCard label="AI Style" value={content.ai_style} />
                        <FieldCard label="VO Script" value={content.vo_script} />
                    </div>

                    {/* Row 4: Caption (50% kiri) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldCard label="Caption" value={content.caption} />
                    </div>

                </div>
            </div>
        </div>
    )
}
