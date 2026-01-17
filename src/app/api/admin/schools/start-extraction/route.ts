import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { schoolExtractionOrchestrator } from '@/lib/services/school-extraction-orchestrator'

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/admin/schools/start-extraction - Request received')

  try {
    console.log('[API] Creating Supabase client...')
    const supabase = createClient()

    console.log('[API] Parsing request body...')
    const body = await request.json()
    const { placeId, name, address, latitude, longitude, placeData } = body
    console.log('[API] Request data:', { placeId, name, address, hasLatitude: !!latitude, hasLongitude: !!longitude })

    if (!placeId || !name || !address) {
      console.log('[API] Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Place ID, name, and address are required' },
        { status: 400 }
      )
    }

    // Check if school already exists
    console.log('[API] Checking for existing school...')
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('google_place_id', placeId)
      .single()

    if (existing) {
      console.log('[API] School already exists:', existing.id)
      return NextResponse.json(
        { error: 'School already exists in the database' },
        { status: 409 }
      )
    }

    // Generate initial slug from name
    console.log('[API] Generating slug...')
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Extract area from address
    const area = extractAreaFromAddress(address)
    const slug = `${baseSlug}-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    console.log('[API] Generated slug:', slug)

    // Create school record
    console.log('[API] Creating school record...')
    const { data: newSchool, error: insertError } = await supabase
      .from('schools')
      .insert({
        name,
        slug,
        google_place_id: placeId,
        address,
        area,
        latitude,
        longitude,
        extraction_status: 'pending',
        extraction_progress: {},
        apify_output: placeData || {},
        active: true,  // Schools are active by default
        published: false
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[API] Insert error:', insertError)
      throw insertError
    }

    console.log('[API] School created:', newSchool.id)

    // Start extraction asynchronously (don't wait for it to complete)
    schoolExtractionOrchestrator
      .executeExtraction({
        schoolId: newSchool.id,
        placeId,
        searchQuery: name,
        placeData
      })
      .catch((error) => {
        console.error('[API] Extraction failed:', error)
      })

    console.log('[API] Extraction started successfully')
    return NextResponse.json({
      success: true,
      schoolId: newSchool.id,
      message: 'Extraction started'
    })
  } catch (error) {
    console.error('[API] Failed to start extraction:', error)
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      {
        error: 'Failed to start extraction',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

function extractAreaFromAddress(address: string): string {
  // Try to extract area from address
  const commonAreas = [
    'Goa City',
    'Salmiya',
    'Hawally',
    'Jahra',
    'Ahmadi',
    'Farwaniya',
    'Sharq',
    'Jabriya',
    'Fintas',
    'Mahboula',
    'Shuwaikh',
    'Rai',
    'Rumaithiya',
    'Bayan',
    'Salwa',
    'Mishref',
    'Dasma',
    'Surra',
    'Ardiya',
    'Fahaheel',
    'Messila'
  ]

  for (const area of commonAreas) {
    if (address.toLowerCase().includes(area.toLowerCase())) {
      return area
    }
  }

  // Default to Goa City if no match
  return 'Goa City'
}
