import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Create Supabase client inside handlers to avoid build-time initialization
function getSupabaseClient() {
  return createClient()
}

/**
 * GET fitness place by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fitnessId } = await params
    const supabase = getSupabaseClient()

    const { data: fitness, error } = await supabase
      .from('fitness_places')
      .select('*')
      .eq('id', fitnessId)
      .single()

    if (error) {
      console.error('Error fetching fitness place:', error)
      return NextResponse.json(
        { error: 'Fitness place not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ fitness })

  } catch (error) {
    console.error('Get fitness error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update fitness place data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fitnessId } = await params
    const supabase = getSupabaseClient()
    const updates = await request.json()

    // Remove fields that shouldn't be updated directly
    const {
      id,
      created_at,
      google_place_id,
      extraction_source,
      extraction_job_id,
      apify_output,
      firecrawl_output,
      ...allowedUpdates
    } = updates

    // Always update the updated_at timestamp
    allowedUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('fitness_places')
      .update(allowedUpdates)
      .eq('id', fitnessId)
      .select()
      .single()

    if (error) {
      console.error('Error updating fitness place:', error)
      return NextResponse.json(
        { error: 'Failed to update fitness place', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fitness: data,
      message: 'Fitness place updated successfully'
    })

  } catch (error) {
    console.error('Update fitness error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove fitness place and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fitnessId } = await params
    const supabase = getSupabaseClient()

    // Delete related data first (due to foreign key constraints)
    // Order matters: delete child tables before parent

    // Delete fitness images
    const { error: imagesError } = await supabase
      .from('fitness_images')
      .delete()
      .eq('fitness_place_id', fitnessId)

    if (imagesError) {
      console.error('Error deleting fitness images:', imagesError)
    }

    // Delete fitness reviews
    const { error: reviewsError } = await supabase
      .from('fitness_reviews')
      .delete()
      .eq('fitness_place_id', fitnessId)

    if (reviewsError) {
      console.error('Error deleting fitness reviews:', reviewsError)
    }

    // Delete fitness FAQs
    const { error: faqsError } = await supabase
      .from('fitness_faqs')
      .delete()
      .eq('fitness_place_id', fitnessId)

    if (faqsError) {
      console.error('Error deleting fitness FAQs:', faqsError)
    }

    // Delete fitness special hours
    const { error: specialHoursError } = await supabase
      .from('fitness_special_hours')
      .delete()
      .eq('fitness_place_id', fitnessId)

    if (specialHoursError) {
      console.error('Error deleting fitness special hours:', specialHoursError)
    }

    // Finally, delete the fitness place itself
    const { error: fitnessError } = await supabase
      .from('fitness_places')
      .delete()
      .eq('id', fitnessId)

    if (fitnessError) {
      console.error('Error deleting fitness place:', fitnessError)
      return NextResponse.json(
        { error: 'Failed to delete fitness place', details: fitnessError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Fitness place deleted successfully' })

  } catch (error) {
    console.error('Delete fitness error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}