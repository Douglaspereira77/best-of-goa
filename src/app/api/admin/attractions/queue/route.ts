import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Get attractions in queue (pending or processing)
    const { data: attractions, error } = await supabase
      .from('attractions')
      .select(
        `
        id,
        name,
        slug,
        area,
        extraction_status,
        extraction_progress,
        created_at
      `
      )
      .in('extraction_status', ['pending', 'processing', 'failed'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    // Map to frontend format
    const queue = (attractions || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      area: a.area,
      extractionStatus: a.extraction_status,
      extractionProgress: a.extraction_progress || {},
      createdAt: a.created_at
    }))

    return NextResponse.json({ queue })
  } catch (error) {
    console.error('[API] Failed to load queue:', error)
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }
}
