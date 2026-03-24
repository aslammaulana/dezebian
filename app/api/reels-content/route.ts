import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('reels_content')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { topic, status = 'idea', priority = 'Med', table_id, sprint_id } = body

    const { data, error } = await supabaseAdmin
        .from('reels_content')
        .insert({ topic, status, priority, table_id, sprint_id: sprint_id || null })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
        .from('reels_content')
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
        .from('reels_content')
        .delete()
        .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
