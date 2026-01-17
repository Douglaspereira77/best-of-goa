import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/restaurants/queue
 * 
 * Fetches restaurant queue with filtering options
 * Supports filtering by status and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const cuisineId = searchParams.get('cuisine') || null
    const categoryId = searchParams.get('category') || null
    const neighborhoodId = searchParams.get('neighborhood') || null

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured')
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient()

    // Build query based on status filter
    let query = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        slug,
        status,
        verified,
        active,
        created_at,
        updated_at,
        job_progress,
        error_logs
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter based on ACTUAL database values
    // Database only stores: 'processing', 'active', 'failed'
    // PHASE 1: All restaurants auto-publish (active=true after extraction)
    // PHASE 2 TODO: Add manual verification workflow (active=false until verified)
    if (status !== 'all') {
      if (status === 'pending') {
        // Pending = extracted but not verified
        // PHASE 1: Shows all active restaurants (auto-published)
        // PHASE 2: Will show only active=false restaurants awaiting review
        query = query.eq('status', 'active').eq('verified', false)
      } else if (status === 'processing') {
        // Processing = currently extracting
        query = query.eq('status', 'processing')
      } else if (status === 'completed') {
        // Completed = extracted and verified
        query = query.eq('status', 'active').eq('verified', true)
      } else if (status === 'failed') {
        // Failed = extraction failed
        query = query.eq('status', 'failed')
      } else if (status === 'published') {
        // Published = completed + active (backward compatibility)
        query = query.eq('verified', true).eq('active', true)
      } else {
        // Fallback for any other status (shouldn't happen)
        query = query.eq('status', status)
      }
    }

    // Apply additional filters
    if (cuisineId) {
      // Filter by cuisine - check if cuisine ID is in the restaurant_cuisine_ids array
      query = query.contains('restaurant_cuisine_ids', [cuisineId])
    }

    if (categoryId) {
      // Filter by category - check if category ID is in the restaurant_category_ids array
      query = query.contains('restaurant_category_ids', [categoryId])
    }

    if (neighborhoodId) {
      // Filter by neighborhood
      query = query.eq('neighborhood_id', parseInt(neighborhoodId))
    }

    const { data: restaurants, error: restaurantsError } = await query

    if (restaurantsError) {
      console.error('Failed to fetch restaurants:', restaurantsError)
      return NextResponse.json(
        { error: 'Failed to fetch restaurant queue' },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const queueItems = restaurants.map(restaurant => {
      // Calculate progress percentage
      let progress_percentage = 0
      let current_step = null

      if (restaurant.job_progress) {
        const steps = [
          'apify_fetch',
          'firecrawl_general',
          'firecrawl_menu',
          'firecrawl_website',
          'apify_reviews',
          'apify_images',
          'upload_images',
          'ai_enhancement',
          'data_mapping'
        ]

        const completedSteps = steps.filter(
          step => restaurant.job_progress[step]?.status === 'completed'
        ).length

        progress_percentage = Math.round((completedSteps / steps.length) * 100)

        const runningStep = steps.find(
          step => restaurant.job_progress[step]?.status === 'running'
        )
        current_step = runningStep || null
      }

      // Get error message if failed
      let error_message = null
      if (restaurant.status === 'failed' && restaurant.error_logs?.length > 0) {
        error_message = restaurant.error_logs[0].message || 'Unknown error'
      }

      // Normalize status for display
      let displayStatus = restaurant.status
      if (restaurant.status === 'importing') {
        displayStatus = 'processing'
      } else if (restaurant.status === 'active' && restaurant.verified) {
        displayStatus = 'completed'
      } else if (restaurant.status === 'active' && !restaurant.verified) {
        displayStatus = 'pending'
      }

      return {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: displayStatus,
        verified: restaurant.verified,
        active: restaurant.active,
        progress_percentage,
        current_step,
        error_message,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at
      }
    })

    return NextResponse.json({
      success: true,
      restaurants: queueItems,
      pagination: {
        limit,
        offset,
        total: queueItems.length
      }
    })

  } catch (error) {
    console.error('Queue fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

