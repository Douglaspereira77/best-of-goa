import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/dashboard/stats
 * 
 * Fetches dashboard statistics for admin overview
 * Returns counts for different restaurant statuses
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get restaurant counts by status
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('status, verified, active, created_at')

    if (restaurantsError) {
      console.error('Failed to fetch restaurants:', restaurantsError)
      return NextResponse.json(
        { error: 'Failed to fetch restaurant data' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = {
      pending_review: 0,
      published: 0,
      processing: 0,
      failed: 0,
      total_restaurants: restaurants.length,
      recent_imports: 0
    }

    // Count by status
    restaurants.forEach(restaurant => {
      if (restaurant.status === 'pending' || restaurant.status === 'completed') {
        if (restaurant.verified && restaurant.active) {
          stats.published++
        } else {
          stats.pending_review++
        }
      } else if (restaurant.status === 'processing') {
        stats.processing++
      } else if (restaurant.status === 'failed') {
        stats.failed++
      }
    })

    // Count recent imports (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    stats.recent_imports = restaurants.filter(restaurant => 
      new Date(restaurant.created_at) >= sevenDaysAgo
    ).length

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

