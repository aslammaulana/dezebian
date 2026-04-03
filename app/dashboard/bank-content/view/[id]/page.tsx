'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Loader2, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { BankContent, BankContentStatus } from '@/lib/types'

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_BADGE: Record<BankContentStatus, string> = {
    'Draft': 'text-zinc-400 bg-zinc-800 border-zinc-700',
    'Development': 'text-blue-400 bg-blue-900/40 border-blue-800',
    'Need Review': 'text-orange-400 bg-orange-900/40 border-orange-800',
    'Published': 'text-green-400 bg-green-900/40 border-green-800',
}

// ─── View helpers ─────────────────────────────────────────────────────────────
function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[#27272a] flex flex-col bg-[#1a1a1a]">
            <div className="px-5 py-3 border-b border-[#27272a] bg-[#141414] rounded-t-xl">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {children}
            </div>
        </div>
    )
}

function ViewField({ label, value, empty = '—', wide }: {
    label: string; value?: string | null; empty?: string; wide?: boolean
}) {
    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">{label}</p>
            {value ? (
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{value}</p>
            ) : (
                <p className="text-sm text-zinc-600 italic">{empty}</p>
            )}
        </div>
    )
}

function CopyField({ label, value, wide }: {
    label: string; value?: string | null; wide?: boolean
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (!value) return
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
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
            {value ? (
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{value}</p>
            ) : (
                <p className="text-sm text-zinc-600 italic">—</p>
            )}
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

            {/* Content — full width, 2-col grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
                <div className="w-full flex flex-col gap-5">

                    {/* [Utama] */}
                    <ViewSection title="Utama">
                        {/* Topik Masalah — full width */}
                        <ViewField label="Topik Masalah" value={content.topik_masalah} wide />

                        {/* Status badge — full width */}
                        <div className="md:col-span-2">
                            <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">Status</p>
                            <span className={clsx(
                                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
                                STATUS_BADGE[content.status] || STATUS_BADGE['Draft']
                            )}>
                                {content.status}
                            </span>
                        </div>

                        <ViewField label="Hook" value={content.hook} />
                        <ViewField label="Penyebab" value={content.penyebab} />
                        <ViewField label="Solusi" value={content.solusi} />
                        <ViewField label="Fitur Unggulan" value={content.fitur_unggulan} />
                        <ViewField label="CTA" value={content.cta} wide />
                    </ViewSection>

                    {/* [Additional Card] */}
                    <ViewSection title="Additional Card">
                        <CopyField label="AI Style" value={content.ai_style} />
                        <CopyField label="VO Script" value={content.vo_script} />
                        <CopyField label="Caption" value={content.caption} wide />
                    </ViewSection>

                </div>
            </div>
        </div>
    )
}
