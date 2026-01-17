import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/malls/list
 *
 * Fetches all malls with basic info for admin list view
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
      .from('malls')
      .select(`
        id,
        name,
        slug,
        extraction_status,
        area,
        total_stores,
        total_parking_spaces,
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
      query = query.eq('extraction_status', status)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,area.ilike.%${search}%`)
    }

    const { data: malls, error } = await query

    if (error) {
      console.error('Failed to fetch malls:', error)
      return NextResponse.json(
        { error: 'Failed to fetch malls' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('malls')
      .select('id', { count: 'exact', head: true })

    // Apply same filters to count query
    if (status !== 'all') {
      countQuery = countQuery.eq('extraction_status', status)
    }

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,area.ilike.%${search}%`)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      malls: malls || [],
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    console.error('Mall list fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
