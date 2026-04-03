'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Loader2, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { BankContent, BankContentStatus } from '@/lib/types'

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<BankContentStatus, string> = {
    'Draft': 'text-zinc-400 bg-zinc-800 border-zinc-700',
    'Development': 'text-blue-400 bg-blue-900/40 border-blue-800',
    'Need Review': 'text-orange-400 bg-orange-900/40 border-orange-800',
    'Published': 'text-green-400 bg-green-900/40 border-green-800',
}

// ─── Per-field Card ────────────────────────────────────────────────────────────
function FieldCard({ label, value, className }: {
    label: string; value?: string | null; className?: string
}) {
    return (
        <div className={clsx('rounded-lg border border-[#27272a] bg-[#1a1a1a] flex flex-col', className)}>
            <div className="px-4 py-2 border-b border-[#27272a] bg-[#141414] rounded-t-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
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

// ─── Copyable Card ─────────────────────────────────────────────────────────────
function CopyCard({ label, value, className }: {
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BankContentViewPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [content, setContent] = useState<BankContent | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/bank-content/${id}`)
                if (!res.ok) throw new Error('Not found')
                setContent(await res.json())
            } catch (err) {
                console.error(err)
                router.push('/dashboard/bank-content')
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [id])

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
                <button
                    onClick={() => router.push(`/dashboard/bank-content/edit/${id}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer shrink-0"
                >
                    <Pencil size={13} /> Edit
                </button>
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

                    {/* ── [Utama] Cards ── */}
                    {/* Row 1: Topik Masalah | Penyebab | CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldCard label="Topik Masalah" value={content.topik_masalah} />
                        <FieldCard label="Penyebab" value={content.penyebab} />
                        <FieldCard label="CTA" value={content.cta} />
                    </div>

                    {/* Row 2: Hook | Solusi | Fitur Unggulan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldCard label="Hook" value={content.hook} />
                        <FieldCard label="Solusi" value={content.solusi} />
                        <FieldCard label="Fitur Unggulan" value={content.fitur_unggulan} />
                    </div>

                    {/* ── [Additional Card] ── */}
                    {/* Row 3: AI Style | Caption */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CopyCard label="AI Style" value={content.ai_style} />
                        <CopyCard label="Caption" value={content.caption} />
                    </div>

                    {/* Row 4: VO Script full width */}
                    <CopyCard label="VO Script" value={content.vo_script} />

                </div>
            </div>
        </div>
    )
}
