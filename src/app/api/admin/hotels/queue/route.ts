import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('hotels')
      .select('id, name, extraction_status, extraction_progress, created_at, updated_at, hero_image')
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('extraction_status', status)
    }

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: hotels, error } = await query

    if (error) {
      console.error('Queue query error:', error)
      return NextResponse.json(
        { error: 'Failed to load hotels' },
        { status: 500 }
      )
    }

    // Define extraction steps (must match hotel-extraction-orchestrator.ts)
    const EXTRACTION_STEPS = [
      'initial_creation',
      'apify_fetch',
      'firecrawl_general',
      'firecrawl_rooms',
      'firecrawl_website',
      'firecrawl_social_media_search',
      'apify_reviews',
      'firecrawl_tripadvisor',
      'firecrawl_booking_com',
      'process_images',
      'ai_sentiment',
      'ai_enhancement',
      'data_mapping'
    ]

    // Transform to queue format
    const queueHotels = hotels.map(hotel => {
      const progress = hotel.extraction_progress || {}

      // Calculate actual percentage based on completed steps
      const completedSteps = EXTRACTION_STEPS.filter(
        step => progress[step]?.status === 'completed'
      ).length
      const progressPercentage = Math.round((completedSteps / EXTRACTION_STEPS.length) * 100)

      // Find current step (running) or last failed step
      let currentStep = null
      let errorMessage = null

      for (const step of EXTRACTION_STEPS) {
        if (progress[step]?.status === 'running') {
          currentStep = step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          break
        }
        if (progress[step]?.status === 'failed' && progress[step]?.error) {
          errorMessage = progress[step].error
          currentStep = `Failed at: ${step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
        }
      }

      return {
        id: hotel.id,
        name: hotel.name,
        status: hotel.extraction_status || 'pending',
        progress_percentage: progressPercentage,
        current_step: currentStep,
        error_message: errorMessage,
        completed_steps: completedSteps,
        total_steps: EXTRACTION_STEPS.length,
        created_at: hotel.created_at,
        updated_at: hotel.updated_at,
        thumbnail_url: hotel.hero_image
      }
    })

    return NextResponse.json({
      success: true,
      hotels: queueHotels,
      count: queueHotels.length
    })

  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
