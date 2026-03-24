import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('content_tables')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { title, type = 'sprint' } = body

    const { count } = await supabaseAdmin
        .from('content_tables')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'sprint')

    const sprint_number = (count ?? 0) + 1

    const { data, error } = await supabaseAdmin
        .from('content_tables')
        .insert({ title, type, sprint_number })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, title } = body

    const { data, error } = await supabaseAdmin
        .from('content_tables')
        .update({ title })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
    const body = await req.json()
    const { id } = body

    const { error } = await supabaseAdmin
        .from('content_tables')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
