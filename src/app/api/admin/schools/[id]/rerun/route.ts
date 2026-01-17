import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { schoolExtractionOrchestrator } from '@/lib/services/school-extraction-orchestrator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] POST /api/admin/schools/[id]/rerun - Request received')

  try {
    const supabase = createClient()
    const { id } = await params

    // Get the school
    const { data: school, error: fetchError } = await supabase
      .from('schools')
      .select('id, name, google_place_id, slug')
      .eq('id', id)
      .single()

    if (fetchError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    if (!school.google_place_id) {
      return NextResponse.json(
        { error: 'School has no Google Place ID' },
        { status: 400 }
      )
    }

    console.log('[API] Re-running extraction for:', school.name)

    // Reset extraction status
    await supabase
      .from('schools')
      .update({
        extraction_status: 'pending',
        extraction_progress: {},
        extraction_started_at: null,
        extraction_completed_at: null,
      })
      .eq('id', id)

    // Start extraction asynchronously
    schoolExtractionOrchestrator
      .executeExtraction({
        schoolId: school.id,
        placeId: school.google_place_id,
        searchQuery: school.name,
      })
      .catch((error) => {
        console.error('[API] Extraction failed:', error)
      })

    return NextResponse.json({
      success: true,
      schoolId: school.id,
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
