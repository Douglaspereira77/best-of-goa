import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('attractions')
      .select(
        `
        id,
        name,
        slug,
        area,
        attraction_type,
        google_rating,
        google_review_count,
        is_free,
        hero_image,
        extraction_status,
        verified,
        active,
        created_at
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'published') {
        query = query.eq('active', true).eq('verified', true)
      } else if (status === 'draft') {
        query = query.eq('active', false)
      } else {
        query = query.eq('extraction_status', status)
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,area.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const { data: attractions, error, count } = await query

    if (error) {
      throw error
    }

    // Map to frontend format
    const mappedAttractions = (attractions || []).map((a: any) => {
      let status = 'draft'
      if (a.active && a.verified) {
        status = 'published'
      } else if (a.extraction_status === 'failed') {
        status = 'failed'
      } else if (a.extraction_status === 'processing') {
        status = 'processing'
      } else if (a.extraction_status === 'pending') {
        status = 'pending'
      }

      return {
        id: a.id,
        name: a.name,
        slug: a.slug,
        status,
        extraction_status: a.extraction_status,
        area: a.area,
        attractionType: a.attraction_type,
        rating: a.google_rating,
        reviewCount: a.google_review_count,
        isFree: a.is_free || false,
        heroImage: a.hero_image,
        createdAt: a.created_at
      }
    })

    return NextResponse.json({
      attractions: mappedAttractions,
      pagination: {
        total: count || 0,
        limit
      }
    })
  } catch (error) {
    console.error('[API] Failed to list attractions:', error)
    return NextResponse.json(
      { error: 'Failed to load attractions' },
      { status: 500 }
    )
  }
}
