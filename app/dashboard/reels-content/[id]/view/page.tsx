'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { ReelsContent } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
    'idea': 'bg-zinc-700 text-zinc-300',
    'draft': 'bg-blue-500/20 text-blue-400',
    'on-production': 'bg-yellow-500/20 text-yellow-400',
    'edited': 'bg-purple-500/20 text-purple-400',
    'need-review': 'bg-orange-500/20 text-orange-400',
    'approved': 'bg-green-500/20 text-green-400',
    'published': 'bg-emerald-500/20 text-emerald-400',
}

const PRIORITY_COLORS: Record<string, string> = {
    'Low': 'bg-blue-500/20 text-blue-400',
    'Med': 'bg-yellow-500/20 text-yellow-400',
    'High': 'bg-red-500/20 text-red-400',
}

function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass || 'bg-[#27272a] text-zinc-300'}`}>
            {label}
        </span>
    )
}

function ReadField({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
    if (!value?.trim()) return null
    return (
        <div className={wide ? 'col-span-2' : 'col-span-1'}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">{value}</p>
        </div>
    )
}

function Section({ title, children, hasContent }: { title: string; children: React.ReactNode; hasContent: boolean }) {
    if (!hasContent) return null
    return (
        <section className="rounded-xl border border-[#2e2e2e] bg-[#141414] overflow-hidden">
            <div className="px-6 py-3.5 border-b border-[#2e2e2e] bg-[#111]">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-5">
                {children}
            </div>
        </section>
    )
}

export default function ContentViewPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [content, setContent] = useState<ReelsContent | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        fetch(`/api/reels-content/${id}`)
            .then(r => {
                if (!r.ok) { setNotFound(true); throw new Error('Not found') }
                return r.json()
            })
            .then((data: ReelsContent) => setContent(data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false))
    }, [id])

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dz-background">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        )
    }

    if (notFound || !content) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-dz-background text-zinc-500">
                <p className="text-lg text-white font-semibold">Konten tidak ditemukan</p>
                <button onClick={() => router.back()} className="text-sm text-dz-primary hover:underline cursor-pointer">
                    ← Kembali
                </button>
            </div>
        )
    }

    const hasKategorisasi = !![content.content_type, content.section, content.sub_section, content.target_audience, content.funnel, content.offer_status, content.brand].some(v => v?.trim())
    const hasScript = !![content.visual_link, content.visual_description, content.attention, content.interest, content.desire, content.action, content.voiceover_script].some(v => v?.trim())
    const hasHook = !!content.hook?.trim()
    const hasMeta = !![content.caption, content.hashtag, content.audio, content.reference_link, content.location].some(v => v?.trim())

    const formatDate = (d?: string | null) => {
        if (!d) return null
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        } catch { return d }
    }

    return (
        <div className="min-h-full bg-dz-background text-zinc-200">
            {/* Top bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#27272a] bg-[#111]/90 backdrop-blur-md px-6 h-[50px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                    <ArrowLeft size={15} />
                    Kembali
                </button>
                <button
                    onClick={() => router.push(`/dashboard/reels-content/${id}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-dz-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-[#007042] transition-colors cursor-pointer"
                >
                    Edit Konten
                </button>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-3xl px-6 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold text-white leading-snug tracking-tight">
                        {content.topic || <span className="text-zinc-500 italic">Untitled</span>}
                    </h1>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {content.status && (
                            <Badge label={content.status} colorClass={STATUS_COLORS[content.status]} />
                        )}
                        {content.priority && (
                            <Badge label={content.priority} colorClass={PRIORITY_COLORS[content.priority]} />
                        )}
                        {content.format && <Badge label={content.format} />}
                        {content.posting_date && (
                            <span className="text-xs text-zinc-500">📅 {formatDate(content.posting_date)}</span>
                        )}
                    </div>

                    {/* Product */}
                    {content.product_name && (
                        <p className="text-sm text-zinc-400">
                            <span className="font-semibold text-zinc-500 uppercase text-[11px] tracking-widest mr-2">Produk:</span>
                            {content.product_name}
                        </p>
                    )}
                </div>

                <div className="border-t border-[#2e2e2e]" />

                {/* Hook */}
                {hasHook && (
                    <section className="rounded-xl border border-dz-primary/30 bg-dz-primary/5 p-6">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-dz-primary mb-3">🎣 Hook</p>
                        <p className="text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">{content.hook}</p>
                    </section>
                )}

                {/* Kategorisasi */}
                <Section title="Kategorisasi" hasContent={hasKategorisasi}>
                    <ReadField label="Content Type" value={content.content_type} />
                    <ReadField label="Section" value={content.section} />
                    <ReadField label="Sub Section" value={content.sub_section} />
                    <ReadField label="Target Audience" value={content.target_audience} />
                    <ReadField label="Funnel" value={content.funnel} />
                    <ReadField label="Offer Status" value={content.offer_status} />
                    <ReadField label="Brand" value={content.brand} />
                </Section>

                {/* Script AIDA */}
                <Section title="Script & Visual" hasContent={hasScript}>
                    {content.visual_link && (
                        <div className="col-span-2">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Visual Link</p>
                            <a
                                href={content.visual_link.startsWith('http') ? content.visual_link : `https://${content.visual_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm transition-colors"
                            >
                                <span className="truncate">{content.visual_link}</span>
                                <ExternalLink size={13} className="shrink-0" />
                            </a>
                        </div>
                    )}
                    <ReadField label="Deskripsi Visual" value={content.visual_description} wide />
                    <ReadField label="Attention (A)" value={content.attention} wide />
                    <ReadField label="Interest (I)" value={content.interest} wide />
                    <ReadField label="Desire (D)" value={content.desire} wide />
                    <ReadField label="Action (A)" value={content.action} wide />
                    <ReadField label="Voiceover / Script" value={content.voiceover_script} wide />
                </Section>

                {/* Additional Info */}
                <Section title="Informasi Tambahan" hasContent={hasMeta}>
                    <ReadField label="Caption" value={content.caption} wide />
                    <ReadField label="Hashtag" value={content.hashtag} wide />
                    <ReadField label="Audio" value={content.audio} />
                    <ReadField label="Lokasi" value={content.location} />
                    {content.reference_link && (
                        <div className="col-span-2">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Reference Link</p>
                            <a
                                href={content.reference_link.startsWith('http') ? content.reference_link : `https://${content.reference_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm transition-colors"
                            >
                                <span className="truncate">{content.reference_link}</span>
                                <ExternalLink size={13} className="shrink-0" />
                            </a>
                        </div>
                    )}
                </Section>

                <div className="h-8" />
            </div>
        </div>
    )
}
