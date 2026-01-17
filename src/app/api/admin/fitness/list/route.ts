import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const genderPolicy = searchParams.get('gender_policy')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('fitness_places')
      .select(
        `
        id,
        name,
        slug,
        area,
        fitness_types,
        gender_policy,
        google_rating,
        google_review_count,
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
      if (status === 'active') {
        query = query.eq('active', true)
      } else {
        query = query.eq('extraction_status', status)
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,area.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    // Apply gender policy filter
    if (genderPolicy) {
      if (genderPolicy === 'not_set') {
        query = query.is('gender_policy', null)
      } else {
        query = query.eq('gender_policy', genderPolicy)
      }
    }

    const { data: fitnessPlaces, error, count } = await query

    if (error) {
      throw error
    }

    // Map to frontend format
    const mappedFitnessPlaces = (fitnessPlaces || []).map((fp: any) => ({
      id: fp.id,
      name: fp.name,
      slug: fp.slug,
      extraction_status: fp.extraction_status,
      area: fp.area,
      fitness_types: fp.fitness_types,
      gender_policy: fp.gender_policy,
      google_rating: fp.google_rating,
      google_review_count: fp.google_review_count,
      active: fp.active || false,
      hero_image: fp.hero_image,
      created_at: fp.created_at
    }))

    return NextResponse.json({
      fitness_places: mappedFitnessPlaces,
      pagination: {
        total: count || 0,
        limit
      }
    })
  } catch (error) {
    console.error('[API] Failed to list fitness places:', error)
    return NextResponse.json(
      { error: 'Failed to load fitness places' },
      { status: 500 }
    )
  }
}
