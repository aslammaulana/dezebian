import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('bank_content')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const {
        topik_masalah,
        status = 'Draft',
        hook,
        penyebab,
        solusi,
        fitur_unggulan,
        cta,
        ai_style,
        vo_script,
        caption,
    } = body

    if (!topik_masalah) {
        return NextResponse.json({ error: 'topik_masalah is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('bank_content')
        .insert({
            topik_masalah,
            status,
            hook: hook || null,
            penyebab: penyebab || null,
            solusi: solusi || null,
            fitur_unggulan: fitur_unggulan || null,
            cta: cta || null,
            ai_style: ai_style || null,
            vo_script: vo_script || null,
            caption: caption || null,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
        .from('bank_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
    const body = await req.json()
    const { ids } = body

    const { error } = await supabaseAdmin
        .from('bank_content')
        .delete()
        .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
