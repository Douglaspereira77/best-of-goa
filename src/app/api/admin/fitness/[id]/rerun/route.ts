import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fitnessExtractionOrchestrator } from '@/lib/services/fitness-extraction-orchestrator'




export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/admin/fitness/[id]/rerun - Request received')

  try {
    const supabase = createClient()
    const { id } = await params

    // Get the fitness place
    const { data: fitnessPlace, error: fetchError } = await supabase
      .from('fitness_places')
      .select('id, name, google_place_id, slug')
      .eq('id', id)
      .single()

    if (fetchError || !fitnessPlace) {
      return NextResponse.json({ error: 'Fitness place not found' }, { status: 404 })
    }

    if (!fitnessPlace.google_place_id) {
      return NextResponse.json(
        { error: 'Fitness place has no Google Place ID' },
        { status: 400 }
      )
    }

    console.log('[API] Re-running extraction for:', fitnessPlace.name)

    // Reset extraction status
    await supabase
      .from('fitness_places')
      .update({
        extraction_status: 'pending',
        extraction_progress: {},
      })
      .eq('id', id)

    // Start extraction asynchronously
    fitnessExtractionOrchestrator
      .executeExtraction({
        fitnessPlaceId: fitnessPlace.id,
        placeId: fitnessPlace.google_place_id,
        searchQuery: fitnessPlace.name,
      })
      .catch((error) => {
        console.error('[API] Extraction failed:', error)
      })

    return NextResponse.json({
      success: true,
      fitnessPlaceId: fitnessPlace.id,
      message: 'Extraction restarted',
    })
  } catch (error) {
    console.error('[API] Failed to restart extraction:', error)
    return NextResponse.json(
      {
        error: 'Failed to restart extraction',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}































