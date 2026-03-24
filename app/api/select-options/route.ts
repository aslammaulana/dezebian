import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
    const category = req.nextUrl.searchParams.get('category')

    const query = supabaseAdmin
        .from('select_options')
        .select('*')
        .order('order_index', { ascending: true })
        .order('value', { ascending: true })

    if (category) {
        query.eq('category', category)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { category, value, label, order_index = 0 } = body

    if (!category?.trim() || !value?.trim()) {
        return NextResponse.json({ error: 'category and value are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('select_options')
        .insert({ category: category.trim(), value: value.trim(), label: label?.trim() || null, order_index })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, value, label, order_index } = body

    const updates: Record<string, unknown> = {}
    if (value !== undefined) updates.value = value
    if (label !== undefined) updates.label = label || null
    if (order_index !== undefined) updates.order_index = order_index

    const { data, error } = await supabaseAdmin
        .from('select_options')
        .update(updates)
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
        .from('select_options')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
