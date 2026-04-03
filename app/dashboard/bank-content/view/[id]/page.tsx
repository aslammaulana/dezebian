'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react'
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
            <div className="p-5 flex flex-col gap-5">
                {children}
            </div>
        </div>
    )
}

function ViewField({ label, value, empty = '—' }: { label: string; value?: string | null; empty?: string }) {
    return (
        <div>
            <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wide">{label}</p>
            {value ? (
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{value}</p>
            ) : (
                <p className="text-sm text-zinc-600 italic">{empty}</p>
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">

                    {/* [Utama] */}
                    <ViewSection title="Utama">
                        <ViewField label="Topik Masalah" value={content.topik_masalah} />

                        {/* Status badge */}
                        <div>
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
                        <ViewField label="CTA" value={content.cta} />
                    </ViewSection>

                    {/* [Additional Card] */}
                    <ViewSection title="Additional Card">
                        <ViewField label="AI Style" value={content.ai_style} />
                        <ViewField label="VO Script" value={content.vo_script} />
                        <ViewField label="Caption" value={content.caption} />
                    </ViewSection>

                </div>
            </div>
        </div>
    )
}
