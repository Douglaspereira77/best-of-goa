import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Create Supabase client inside handlers to avoid build-time initialization
function getSupabaseClient() {
  return createClient()
}

/**
 * GET hotel by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hotelId } = await params
    const supabase = getSupabaseClient()

    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single()

    if (error) {
      console.error('Error fetching hotel:', error)
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ hotel })

  } catch (error) {
    console.error('Get hotel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update hotel data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hotelId } = await params
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
      .from('hotels')
      .update(allowedUpdates)
      .eq('id', hotelId)
      .select()
      .single()

    if (error) {
      console.error('Error updating hotel:', error)
      return NextResponse.json(
        { error: 'Failed to update hotel', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hotel: data,
      message: 'Hotel updated successfully'
    })

  } catch (error) {
    console.error('Update hotel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove hotel and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hotelId } = await params
    const supabase = getSupabaseClient()

    // Delete related data first (due to foreign key constraints)
    // Order matters: delete child tables before parent

    // Delete hotel images
    const { error: imagesError } = await supabase
      .from('hotel_images')
      .delete()
      .eq('hotel_id', hotelId)

    if (imagesError) {
      console.error('Error deleting hotel images:', imagesError)
    }

    // Delete hotel rooms
    const { error: roomsError } = await supabase
      .from('hotel_rooms')
      .delete()
      .eq('hotel_id', hotelId)

    if (roomsError) {
      console.error('Error deleting hotel rooms:', roomsError)
    }

    // Delete hotel FAQs
    const { error: faqsError } = await supabase
      .from('hotel_faqs')
      .delete()
      .eq('hotel_id', hotelId)

    if (faqsError) {
      console.error('Error deleting hotel FAQs:', faqsError)
    }

    // Delete hotel reviews
    const { error: reviewsError } = await supabase
      .from('hotel_reviews')
      .delete()
      .eq('hotel_id', hotelId)

    if (reviewsError) {
      console.error('Error deleting hotel reviews:', reviewsError)
    }

    // Delete hotel amenities junction table entries
    const { error: amenitiesError } = await supabase
      .from('hotel_amenities')
      .delete()
      .eq('hotel_id', hotelId)

    if (amenitiesError) {
      console.error('Error deleting hotel amenities:', amenitiesError)
    }

    // Finally, delete the hotel itself
    const { error: hotelError } = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotelId)

    if (hotelError) {
      console.error('Error deleting hotel:', hotelError)
      return NextResponse.json(
        { error: 'Failed to delete hotel', details: hotelError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Hotel deleted successfully' })

  } catch (error) {
    console.error('Delete hotel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
