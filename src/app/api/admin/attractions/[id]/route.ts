import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Create Supabase client inside handlers to avoid build-time initialization
function getSupabaseClient() {
  return createClient()
}

/**
 * GET attraction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attractionId } = await params
    const supabase = getSupabaseClient()

    const { data: attraction, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('id', attractionId)
      .single()

    if (error) {
      console.error('Error fetching attraction:', error)
      return NextResponse.json(
        { error: 'Attraction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ attraction })

  } catch (error) {
    console.error('Get attraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update attraction data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attractionId } = await params
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
      .from('attractions')
      .update(allowedUpdates)
      .eq('id', attractionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating attraction:', error)
      return NextResponse.json(
        { error: 'Failed to update attraction', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attraction: data,
      message: 'Attraction updated successfully'
    })

  } catch (error) {
    console.error('Update attraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove attraction and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attractionId } = await params
    const supabase = getSupabaseClient()

    // Delete related data first (due to foreign key constraints)
    // Order matters: delete child tables before parent
    // Note: Database has CASCADE DELETE configured, but we'll be explicit

    // Delete attraction images
    const { error: imagesError } = await supabase
      .from('attraction_images')
      .delete()
      .eq('attraction_id', attractionId)

    if (imagesError) {
      console.error('Error deleting attraction images:', imagesError)
    }

    // Delete attraction reviews
    const { error: reviewsError } = await supabase
      .from('attraction_reviews')
      .delete()
      .eq('attraction_id', attractionId)

    if (reviewsError) {
      console.error('Error deleting attraction reviews:', reviewsError)
    }

    // Delete attraction FAQs
    const { error: faqsError } = await supabase
      .from('attraction_faqs')
      .delete()
      .eq('attraction_id', attractionId)

    if (faqsError) {
      console.error('Error deleting attraction FAQs:', faqsError)
    }

    // Delete attraction special hours
    const { error: specialHoursError } = await supabase
      .from('attraction_special_hours')
      .delete()
      .eq('attraction_id', attractionId)

    if (specialHoursError) {
      console.error('Error deleting attraction special hours:', specialHoursError)
    }

    // Finally, delete the attraction itself
    const { error: attractionError } = await supabase
      .from('attractions')
      .delete()
      .eq('id', attractionId)

    if (attractionError) {
      console.error('Error deleting attraction:', attractionError)
      return NextResponse.json(
        { error: 'Failed to delete attraction', details: attractionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Attraction deleted successfully' })

  } catch (error) {
    console.error('Delete attraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
