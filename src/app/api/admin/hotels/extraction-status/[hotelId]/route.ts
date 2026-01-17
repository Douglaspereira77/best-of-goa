import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/hotels/extraction-status/[hotelId]
 *
 * Returns the current extraction status and progress for a hotel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    if (!hotelId) {
      return NextResponse.json(
        { error: 'hotelId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch hotel with extraction progress
    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single();

    if (error || !hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Map extraction_progress to steps array
    const progress = hotel.extraction_progress || {};
    const steps = [
      'initial_creation',
      'apify_fetch',
      'firecrawl_general',
      'firecrawl_rooms',
      'firecrawl_website',
      'firecrawl_social_media_search',
      'apify_reviews',
      'firecrawl_tripadvisor',
      'firecrawl_booking_com',
      'process_images',
      'ai_sentiment',
      'ai_enhancement',
      'data_mapping'
    ];

    const stepsWithStatus = steps.map(stepName => ({
      name: stepName,
      status: progress[stepName]?.status || 'pending',
      started_at: progress[stepName]?.timestamp,
      completed_at: progress[stepName]?.status === 'completed' ? progress[stepName]?.timestamp : null,
      error: progress[stepName]?.error
    }));

    // Calculate progress percentage
    const completedSteps = stepsWithStatus.filter(s => s.status === 'completed').length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    // Extract basic data for UI
    const extractedData = {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      google_place_id: hotel.google_place_id,
      address: hotel.address,
      area: hotel.area,
      neighborhood: hotel.neighborhood_id,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      phone: hotel.phone,
      email: hotel.email,
      website: hotel.website,
      instagram: hotel.instagram,
      facebook: hotel.facebook,
      twitter: hotel.twitter,
      star_rating: hotel.star_rating,
      hotel_type: hotel.hotel_type,
      google_rating: hotel.google_rating,
      google_review_count: hotel.google_review_count,
      tripadvisor_rating: hotel.tripadvisor_rating,
      booking_com_rating: hotel.booking_com_rating,
      price_range: hotel.price_range,
      description: hotel.description,
      short_description: hotel.short_description,
      review_sentiment: hotel.review_sentiment,
      hero_image: hotel.hero_image,
      apify_output: hotel.apify_output,
      firecrawl_output: hotel.firecrawl_output
    };

    return NextResponse.json({
      success: true,
      hotel_id: hotel.id,
      status: hotel.extraction_status,
      progress_percentage: progressPercentage,
      steps: stepsWithStatus,
      extracted_data: extractedData,
      created_at: hotel.created_at,
      updated_at: hotel.updated_at
    });

  } catch (error) {
    console.error('[ExtractionStatus] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
