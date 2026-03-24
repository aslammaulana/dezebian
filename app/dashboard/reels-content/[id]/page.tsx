'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2, Check } from 'lucide-react'
import clsx from 'clsx'
import { ReelsContent, ContentStatus, Priority, ContentTable } from '@/lib/types'
import { PopoverSelect } from '@/components/ui/PopoverSelect'

// ─── Static Option Sets (status & priority are always fixed) ─────────────────
const STATUS_OPTIONS: ContentStatus[] = ['idea', 'draft', 'on-production', 'edited', 'need-review', 'approved', 'published']
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Med', 'High']

const STATUS_COLORS: Record<string, string> = {
    'idea': 'text-zinc-400 bg-zinc-400',
    'draft': 'text-blue-500 bg-blue-500',
    'on-production': 'text-yellow-500 bg-yellow-500',
    'edited': 'text-purple-500 bg-purple-500',
    'need-review': 'text-orange-500 bg-orange-500',
    'approved': 'text-green-500 bg-green-500',
    'published': 'text-emerald-500 bg-emerald-500',
}

const PRIORITY_COLORS: Record<string, string> = {
    'Low': 'text-blue-500 bg-blue-500',
    'Med': 'text-yellow-500 bg-yellow-500',
    'High': 'text-red-500 bg-red-500',
}

interface SelectOptionItem {
    id: string
    category: string
    value: string
    label: string | null
}

// Helper: extract string values from dynamic options
function optionValues(opts: SelectOptionItem[]): string[] {
    return opts.map(o => o.label || o.value)
}

// ─── Component Helpers ─────────────────────────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[#27272a] flex flex-col h-full bg-[#1a1a1a]">
            <div className="px-5 py-3 border-b border-[#27272a] bg-[#141414] rounded-t-xl">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    )
}

function TextField({ label, value, onChange, placeholder, wide }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean }) {
    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors"
            />
        </div>
    )
}

function TextareaField({ label, value, onChange, placeholder, wide, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; rows?: number }) {
    return (
        <div className={wide ? 'md:col-span-2' : ''}>
            <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-dz-primary transition-colors resize-y"
            />
        </div>
    )
}



function DatetimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
            <input
                type="datetime-local"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-lg bg-[#27272a] border border-[#3a3a3a] px-3 py-2 text-sm text-white outline-none focus:border-dz-primary transition-colors"
            />
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ContentEditPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [tables, setTables] = useState<ContentTable[]>([])

    // Dynamic options from DB
    const [dynOpts, setDynOpts] = useState<Record<string, SelectOptionItem[]>>({
        format: [], content_type: [], section: [], sub_section: [],
        target_audience: [], funnel: [], offer_status: [], brand: [],
    })

    const [form, setForm] = useState<Partial<ReelsContent>>({
        topic: '',
        product_name: '',
        posting_date: '',
        status: 'idea',
        format: '',
        hook: '',
        priority: 'Med',
        sprint_id: '',
        content_type: '',
        section: '',
        sub_section: '',
        target_audience: '',
        funnel: '',
        offer_status: '',
        brand: '',
        visual_link: '',
        visual_description: '',
        attention: '',
        interest: '',
        desire: '',
        action: '',
        voiceover_script: '',
        caption: '',
        hashtag: '',
        audio: '',
        reference_link: '',
        location: '',
    })

    useEffect(() => {
        const load = async () => {
            try {
                const [contentRes, tablesRes, optsRes] = await Promise.all([
                    fetch(`/api/reels-content/${id}`),
                    fetch('/api/content-tables'),
                    fetch('/api/select-options'),
                ])
                if (!contentRes.ok) throw new Error('Not found')
                const content: ReelsContent = await contentRes.json()
                const tablesData: ContentTable[] = await tablesRes.json()
                const allOpts: SelectOptionItem[] = optsRes.ok ? await optsRes.json() : []
                setTables(tablesData)

                // Group options by category
                const grouped: Record<string, SelectOptionItem[]> = {
                    format: [], content_type: [], section: [], sub_section: [],
                    target_audience: [], funnel: [], offer_status: [], brand: [],
                }
                for (const opt of allOpts) {
                    if (grouped[opt.category]) grouped[opt.category].push(opt)
                }
                setDynOpts(grouped)

                // Populate form, converting null → ''
                const populated: Partial<ReelsContent> = {}
                for (const key of Object.keys(form)) {
                    populated[key as keyof ReelsContent] = (content[key as keyof ReelsContent] ?? '') as any
                }
                setForm(populated)
            } catch (err) {
                console.error(err)
                router.push('/dashboard/reels-content')
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [id])

    const set = (field: keyof ReelsContent) => (value: string) => {
        setForm(prev => ({ ...prev, [field]: value || null }))
    }

    const str = (field: keyof ReelsContent): string => String(form[field] || '')

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch(`/api/reels-content/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Failed to save')
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Hapus konten ini? Tindakan ini tidak bisa dibatalkan.')) return
        await fetch(`/api/reels-content/${id}`, { method: 'DELETE' })
        router.push('/dashboard/reels-content')
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dz-background">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        )
    }

    const sprintTables = tables.filter(t => t.type === 'sprint')

    return (
        <div className="flex h-full w-full flex-col bg-dz-background overflow-hidden">
            {/* Top Bar */}
            <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] bg-[#1A1A1A] px-4 gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard/reels-content')}
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <span className="text-zinc-600">/</span>
                    <span className="text-sm text-white font-medium truncate max-w-[200px] md:max-w-none">{str('topic') || 'Untitled'}</span>
                </div>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
                <div className="w-full flex flex-col gap-5">

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
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

                    {/* Row 1: Utama & Kategorisasi */}
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                        <div className="xl:col-span-3"> {/* 60% */}
                            <FormSection title="Utama">
                                <TextField label="Topik / Judul" value={str('topic')} onChange={set('topic')} placeholder="Judul konten..." wide />
                                <TextField label="Nama Produk" value={str('product_name')} onChange={set('product_name')} placeholder="Nama produk..." />
                                <DatetimeField label="Tanggal Posting" value={str('posting_date')} onChange={set('posting_date')} />
                                <PopoverSelect label="Status" value={str('status')} onChange={set('status')} options={STATUS_OPTIONS as string[]} colorMap={STATUS_COLORS} />
                                <PopoverSelect label="Format" value={str('format')} onChange={set('format')} options={optionValues(dynOpts.format)} />
                                <TextField label="Hook" value={str('hook')} onChange={set('hook')} placeholder="Hook konten..." />
                                <PopoverSelect label="Prioritas" value={str('priority')} onChange={set('priority')} options={PRIORITY_OPTIONS as string[]} colorMap={PRIORITY_COLORS} />

                                <PopoverSelect
                                    label="Sprint"
                                    value={str('sprint_id') ? (sprintTables.find(t => t.id === str('sprint_id'))?.title || '') : ''}
                                    onChange={v => {
                                        const selectedId = sprintTables.find(t => (t.title || `Sprint ${t.sprint_number}`) === v)?.id || ''
                                        set('sprint_id')(selectedId)
                                    }}
                                    options={sprintTables.map(t => t.title || `Sprint ${t.sprint_number}`)}
                                    placeholder="— Tidak ada sprint —"
                                />
                            </FormSection>
                        </div>
                        <div className="xl:col-span-2"> {/* 40% */}
                            <FormSection title="Kategorisasi">
                                <PopoverSelect label="Tipe Konten" value={str('content_type')} onChange={set('content_type')} options={optionValues(dynOpts.content_type)} />
                                <PopoverSelect label="Section" value={str('section')} onChange={set('section')} options={optionValues(dynOpts.section)} />
                                <PopoverSelect label="Sub-Section" value={str('sub_section')} onChange={set('sub_section')} options={optionValues(dynOpts.sub_section)} />
                                <PopoverSelect label="Target Audiens" value={str('target_audience')} onChange={set('target_audience')} options={optionValues(dynOpts.target_audience)} />
                                <PopoverSelect label="Tujuan / Funnel" value={str('funnel')} onChange={set('funnel')} options={optionValues(dynOpts.funnel)} />
                                <PopoverSelect label="Status Penawaran" value={str('offer_status')} onChange={set('offer_status')} options={optionValues(dynOpts.offer_status)} />
                                <PopoverSelect label="Brand" value={str('brand')} onChange={set('brand')} options={optionValues(dynOpts.brand)} />
                            </FormSection>
                        </div>
                    </div>

                    {/* Row 2: Script & Additional Info */}
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                        <div className="xl:col-span-3"> {/* 60% */}
                            <FormSection title="Script">
                                <TextField label="Visual (Link)" value={str('visual_link')} onChange={set('visual_link')} placeholder="https://..." wide />
                                <TextareaField label="Visual Description" value={str('visual_description')} onChange={set('visual_description')} wide rows={3} />
                                <TextareaField label="Attention" value={str('attention')} onChange={set('attention')} rows={3} />
                                <TextareaField label="Interest" value={str('interest')} onChange={set('interest')} rows={3} />
                                <TextareaField label="Desire" value={str('desire')} onChange={set('desire')} rows={3} />
                                <TextareaField label="Action (CTA)" value={str('action')} onChange={set('action')} rows={3} />
                                <TextareaField label="Voiceover Script" value={str('voiceover_script')} onChange={set('voiceover_script')} wide rows={5} />
                            </FormSection>
                        </div>
                        <div className="xl:col-span-2"> {/* 40% */}
                            <FormSection title="Additional Info">
                                <TextareaField label="Caption" value={str('caption')} onChange={set('caption')} wide rows={4} />
                                <TextareaField label="Hashtag" value={str('hashtag')} onChange={set('hashtag')} wide rows={3} />
                                <TextField label="Audio" value={str('audio')} onChange={set('audio')} placeholder="Nama / link audio..." wide />
                                <TextareaField label="Referensi Link" value={str('reference_link')} onChange={set('reference_link')} wide rows={3} />
                                <TextareaField label="Lokasi Pengambilan" value={str('location')} onChange={set('location')} wide rows={2} />
                            </FormSection>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    )
}
