import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ school })
  } catch (error) {
    console.error('[API] Failed to fetch school:', error)
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    )
  }
}
