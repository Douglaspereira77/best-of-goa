import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attractionExtractionOrchestrator } from '@/lib/services/attraction-extraction-orchestrator'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { placeId, name, address, latitude, longitude, placeData } = await request.json()

    if (!placeId || !name || !address) {
      return NextResponse.json(
        { error: 'Place ID, name, and address are required' },
        { status: 400 }
      )
    }

    // Check if attraction already exists
    const { data: existing } = await supabase
      .from('attractions')
      .select('id')
      .eq('google_place_id', placeId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Attraction already exists in the database' },
        { status: 409 }
      )
    }

    // Generate initial slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Extract area from address
    const area = extractAreaFromAddress(address)
    const slug = `${baseSlug}-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

    // Create attraction record
    const { data: newAttraction, error: insertError } = await supabase
      .from('attractions')
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
        active: false,
        verified: false,
        featured: false
      })
      .select('id')
      .single()

    if (insertError) {
      throw insertError
    }

    // Start extraction asynchronously (don't wait for it to complete)
    attractionExtractionOrchestrator
      .executeExtraction({
        attractionId: newAttraction.id,
        placeId,
        searchQuery: name,
        placeData
      })
      .catch((error) => {
        console.error('[API] Extraction failed:', error)
      })

    return NextResponse.json({
      success: true,
      attractionId: newAttraction.id,
      message: 'Extraction started'
    })
  } catch (error) {
    console.error('[API] Failed to start extraction:', error)
    return NextResponse.json(
      { error: 'Failed to start extraction' },
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
    'Rai'
  ]

  for (const area of commonAreas) {
    if (address.toLowerCase().includes(area.toLowerCase())) {
      return area
    }
  }

  // Default to Goa City if no match
  return 'Goa City'
}
