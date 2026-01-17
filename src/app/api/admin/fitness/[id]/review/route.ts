import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Load fitness place data for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: fitness, error } = await supabase
      .from('fitness_places')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    if (!fitness) {
      return NextResponse.json(
        { error: 'Fitness place not found' },
        { status: 404 }
      )
    }

    // Convert snake_case to camelCase for frontend
    const mappedFitness = {
      id: fitness.id,
      name: fitness.name,
      slug: fitness.slug,
      description: fitness.description,
      short_description: fitness.short_description,
      address: fitness.address,
      area: fitness.area,
      fitness_types: fitness.fitness_types || [],
      gender_policy: fitness.gender_policy || 'co-ed',
      amenities: fitness.amenities || {},
      pricing_summary: fitness.pricing_summary,
      class_schedule: fitness.class_schedule,
      phone: fitness.phone,
      email: fitness.email,
      website: fitness.website,
      instagram: fitness.instagram,
      facebook: fitness.facebook,
      twitter: fitness.twitter,
      tiktok: fitness.tiktok,
      google_rating: fitness.google_rating,
      google_review_count: fitness.google_review_count,
      meta_title: fitness.meta_title,
      meta_description: fitness.meta_description,
      meta_keywords: fitness.meta_keywords || [],
      hero_image: fitness.hero_image,
      opening_hours: fitness.opening_hours,
      extraction_status: fitness.extraction_status,
      verified: fitness.verified || false,
      featured: fitness.featured || false,
      active: fitness.active || false,
      created_at: fitness.created_at,
      updated_at: fitness.updated_at,
      apify_output: fitness.apify_output || {},
      firecrawl_output: fitness.firecrawl_output || null
    }

    return NextResponse.json({ fitness: mappedFitness })
  } catch (error) {
    console.error('[API] Failed to load fitness place:', error)
    return NextResponse.json(
      { error: 'Failed to load fitness place' },
      { status: 500 }
    )
  }
}

// PUT - Update fitness place data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const updates = await request.json()

    // Prepare update object (snake_case for database)
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    }

    // Map only the fields that should be updatable
    const allowedFields = [
      'name',
      'description',
      'short_description',
      'address',
      'area',
      'fitness_types',
      'gender_policy',
      'amenities',
      'pricing_summary',
      'class_schedule',
      'phone',
      'email',
      'website',
      'instagram',
      'facebook',
      'twitter',
      'tiktok',
      'google_rating',
      'google_review_count',
      'meta_title',
      'meta_description',
      'meta_keywords',
      'verified',
      'featured'
    ]

    for (const field of allowedFields) {
      if (field in updates) {
        dbUpdates[field] = updates[field]
      }
    }

    const { data: updatedFitness, error } = await supabase
      .from('fitness_places')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Map back to camelCase
    const mappedFitness = {
      id: updatedFitness.id,
      name: updatedFitness.name,
      slug: updatedFitness.slug,
      description: updatedFitness.description,
      short_description: updatedFitness.short_description,
      address: updatedFitness.address,
      area: updatedFitness.area,
      fitness_types: updatedFitness.fitness_types || [],
      gender_policy: updatedFitness.gender_policy || 'co-ed',
      amenities: updatedFitness.amenities || {},
      pricing_summary: updatedFitness.pricing_summary,
      class_schedule: updatedFitness.class_schedule,
      phone: updatedFitness.phone,
      email: updatedFitness.email,
      website: updatedFitness.website,
      instagram: updatedFitness.instagram,
      facebook: updatedFitness.facebook,
      twitter: updatedFitness.twitter,
      tiktok: updatedFitness.tiktok,
      google_rating: updatedFitness.google_rating,
      google_review_count: updatedFitness.google_review_count,
      meta_title: updatedFitness.meta_title,
      meta_description: updatedFitness.meta_description,
      meta_keywords: updatedFitness.meta_keywords || [],
      hero_image: updatedFitness.hero_image,
      opening_hours: updatedFitness.opening_hours,
      extraction_status: updatedFitness.extraction_status,
      verified: updatedFitness.verified || false,
      featured: updatedFitness.featured || false,
      active: updatedFitness.active || false,
      created_at: updatedFitness.created_at,
      updated_at: updatedFitness.updated_at,
      apify_output: updatedFitness.apify_output || {},
      firecrawl_output: updatedFitness.firecrawl_output || null
    }

    return NextResponse.json({ fitness: mappedFitness })
  } catch (error) {
    console.error('[API] Failed to update fitness place:', error)
    return NextResponse.json(
      { error: 'Failed to update fitness place' },
      { status: 500 }
    )
  }
}