import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { extractionOrchestrator } from '@/lib/services/extraction-orchestrator';

/**
 * POST /api/admin/restaurants/[id]/re-extract
 *
 * Re-runs extraction for an existing restaurant to populate missing data
 * Uses the existing Google Place ID to fetch fresh data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient();

    // Fetch existing restaurant data
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch restaurant:', fetchError);
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.google_place_id) {
      return NextResponse.json(
        { error: 'Restaurant does not have a Google Place ID for re-extraction' },
        { status: 400 }
      );
    }

    // Update restaurant status to processing
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        status: 'processing',
        import_started_at: new Date().toISOString(),
        job_progress: {
          re_extraction: {
            status: 'running',
            started_at: new Date().toISOString()
          }
        }
      })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('Failed to update restaurant status:', updateError);
      return NextResponse.json(
        { error: 'Failed to start re-extraction' },
        { status: 500 }
      );
    }

    // Prepare extraction job with existing data
    const extractionJob = {
      restaurantId: restaurantId,
      placeId: restaurant.google_place_id,
      searchQuery: restaurant.name,
      placeData: {
        name: restaurant.name,
        formatted_address: restaurant.address,
        geometry: {
          location: {
            lat: restaurant.latitude,
            lng: restaurant.longitude
          }
        }
      }
    };

    // Trigger background re-extraction (async, non-blocking)
    extractionOrchestrator.executeExtraction(extractionJob).catch(error => {
      console.error('[API] Re-extraction error:', error);
      
      // Update status to failed if extraction fails
      supabase
        .from('restaurants')
        .update({
          status: 'failed',
          job_progress: {
            re_extraction: {
              status: 'failed',
              completed_at: new Date().toISOString(),
              error: error.message
            }
          }
        })
        .eq('id', restaurantId);
    });

    console.log(`[API] Re-extraction started for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      restaurant_id: restaurantId,
      message: 'Re-extraction started successfully',
      status: 'processing'
    });

  } catch (error) {
    console.error('Re-extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

