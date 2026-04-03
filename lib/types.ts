// Types for the Content Planning feature

export type ContentStatus =
    | 'idea'
    | 'draft'
    | 'on-production'
    | 'edited'
    | 'need-review'
    | 'approved'
    | 'published'

export type Priority = 'Low' | 'Med' | 'High'

export interface ContentTable {
    id: string
    title: string
    type: string // 'sprint' | 'tasks'
    sprint_number?: number
    created_at?: string
}

export interface ReelsContent {
    id: string
    // [Utama]
    topic: string
    product_name?: string | null
    posting_date?: string | null
    status: ContentStatus
    format?: string | null
    hook?: string | null
    priority: Priority
    sprint_id?: string | null
    // [Kategorisasi]
    content_type?: string | null
    section?: string | null
    sub_section?: string | null
    target_audience?: string | null
    funnel?: string | null
    offer_status?: string | null
    brand?: string | null
    // [Script]
    visual_link?: string | null
    visual_description?: string | null
    attention?: string | null
    interest?: string | null
    desire?: string | null
    action?: string | null
    voiceover_script?: string | null
    // [Additional Info]
    caption?: string | null
    hashtag?: string | null
    audio?: string | null
    reference_link?: string | null
    location?: string | null
    // Meta
    table_id: string
    created_at?: string
}

// ─── Bank Content ───────────────────────────────────────────────────────────

export type BankContentStatus = 'Draft' | 'Development' | 'Need Review' | 'Published'

export interface BankContent {
    id: string
    // [Utama]
    topik_masalah: string
    status: BankContentStatus
    hook?: string | null
    penyebab?: string | null
    solusi?: string | null
    fitur_unggulan?: string | null
    cta?: string | null
    // [Additional Card]
    ai_style?: string | null
    vo_script?: string | null
    caption?: string | null
    // Meta
    created_at?: string
}
