import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attractionExtractionOrchestrator } from '@/lib/services/attraction-extraction-orchestrator'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { attractionId } = await request.json()

    if (!attractionId) {
      return NextResponse.json({ error: 'attractionId is required' }, { status: 400 })
    }

    // Get attraction data
    const { data: attraction, error } = await supabase
      .from('attractions')
      .select('id, google_place_id, name')
      .eq('id', attractionId)
      .single()

    if (error || !attraction) {
      return NextResponse.json({ error: 'Attraction not found' }, { status: 404 })
    }

    // Reset status
    await supabase
      .from('attractions')
      .update({
        extraction_status: 'pending',
        extraction_progress: {}
      })
      .eq('id', attractionId)

    // Start extraction asynchronously
    attractionExtractionOrchestrator
      .executeExtraction({
        attractionId: attraction.id,
        placeId: attraction.google_place_id,
        searchQuery: attraction.name
      })
      .catch((err) => {
        console.error('[API] Retry extraction failed:', err)
      })

    return NextResponse.json({
      success: true,
      message: 'Extraction retry started',
      attractionId: attraction.id
    })
  } catch (error) {
    console.error('[API] Failed to retry extraction:', error)
    return NextResponse.json({ error: 'Failed to retry extraction' }, { status: 500 })
  }
}
