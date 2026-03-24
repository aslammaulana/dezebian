import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
    const tableId = req.nextUrl.searchParams.get('table_id')

    let query = supabaseAdmin
        .from('competitors')
        .select('*')
        .order('created_at', { ascending: true })

    if (tableId) {
        query = query.eq('table_id', tableId)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { competitor, link_instagram = '', follower = 0, table_id } = body

    const { data, error } = await supabaseAdmin
        .from('competitors')
        .insert({ competitor, link_instagram, follower, table_id })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
        .from('competitors')
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
        .from('competitors')
        .delete()
        .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
