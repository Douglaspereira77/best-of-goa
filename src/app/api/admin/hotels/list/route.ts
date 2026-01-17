import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/hotels/list
 *
 * Fetches all hotels with basic info for admin list view
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('hotels')
      .select(`
        id,
        name,
        slug,
        extraction_status,
        verified,
        active,
        area,
        star_rating,
        google_rating,
        google_review_count,
        created_at,
        updated_at,
        hero_image
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status !== 'all') {
      if (status === 'draft') {
        // Draft = completed but not verified
        query = query.eq('extraction_status', 'completed').eq('verified', false)
      } else if (status === 'published') {
        // Published = active and verified
        query = query.eq('active', true).eq('verified', true)
      } else if (status === 'failed') {
        // Failed extraction
        query = query.eq('extraction_status', 'failed')
      } else if (status === 'processing') {
        // Currently extracting
        query = query.eq('extraction_status', 'processing')
      } else if (status === 'pending') {
        // Pending extraction
        query = query.eq('extraction_status', 'pending')
      }
    }

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: hotels, error } = await query

    if (error) {
      console.error('Failed to fetch hotels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch hotels' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('hotels')
      .select('id', { count: 'exact', head: true })

    // Apply same filters to count query
    if (status !== 'all') {
      if (status === 'draft') {
        countQuery = countQuery.eq('extraction_status', 'completed').eq('verified', false)
      } else if (status === 'published') {
        countQuery = countQuery.eq('active', true).eq('verified', true)
      } else if (status === 'failed') {
        countQuery = countQuery.eq('extraction_status', 'failed')
      } else if (status === 'processing') {
        countQuery = countQuery.eq('extraction_status', 'processing')
      } else if (status === 'pending') {
        countQuery = countQuery.eq('extraction_status', 'pending')
      }
    }

    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`)
    }

    const { count } = await countQuery

    // Transform data for frontend
    const listItems = hotels.map(hotel => {
      // Determine display status based on extraction_status, active, and verified
      let displayStatus = 'draft'
      if (hotel.extraction_status === 'processing') {
        displayStatus = 'processing'
      } else if (hotel.extraction_status === 'failed') {
        displayStatus = 'failed'
      } else if (hotel.extraction_status === 'pending') {
        displayStatus = 'pending'
      } else if (hotel.extraction_status === 'completed' && hotel.active && hotel.verified) {
        displayStatus = 'published'
      } else if (hotel.extraction_status === 'completed') {
        displayStatus = 'draft'
      }

      return {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        status: displayStatus,
        area: hotel.area || 'Unknown',
        starRating: hotel.star_rating,
        rating: hotel.google_rating,
        reviewCount: hotel.google_review_count,
        heroImage: hotel.hero_image,
        createdAt: hotel.created_at,
        updatedAt: hotel.updated_at
      }
    })

    return NextResponse.json({
      success: true,
      hotels: listItems,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    console.error('Hotel list fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
