import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch extraction queue
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Fetch fitness places that are pending or processing
    const { data: queue, error } = await supabase
      .from('fitness_places')
      .select('id, name, slug, area, extraction_status, extraction_progress, created_at')
      .in('extraction_status', ['pending', 'processing'])
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ queue: queue || [] })
  } catch (error) {
    console.error('[API] Failed to load fitness queue:', error)
    return NextResponse.json(
      { error: 'Failed to load extraction queue' },
      { status: 500 }
    )
  }
}
