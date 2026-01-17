import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { ImageExtractor } from '@/lib/services/image-extractor';

/**
 * POST /api/admin/retry-image-extraction
 *
 * Retries image extraction for a restaurant
 * Used when image extraction fails during main extraction
 */
export async function POST(request: NextRequest) {
  try {
    const { restaurant_id } = await request.json();

    if (!restaurant_id || typeof restaurant_id !== 'string') {
      return NextResponse.json(
        { error: 'restaurant_id is required' },
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

    // Check if restaurant exists
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, job_progress')
      .eq('id', restaurant_id)
      .single();

    if (fetchError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Retrying image extraction for restaurant ${restaurant_id}`);

    // Reset process_images step to running
    const jobProgress = restaurant.job_progress || {};
    jobProgress['process_images'] = {
      status: 'running',
      started_at: new Date().toISOString(),
      completed_at: null,
      error: null,
      images_processed: 0,
      images_total: 10,
      current_cost: 0
    };

    await supabase
      .from('restaurants')
      .update({ job_progress: jobProgress })
      .eq('id', restaurant_id);

    // Trigger background image extraction (async, non-blocking)
    runImageExtraction(restaurant_id).catch(error => {
      console.error('[API] Background image extraction error:', error);
    });

    console.log(`[API] Image extraction retry started for restaurant ${restaurant_id}`);

    return NextResponse.json({
      success: true,
      restaurant_id: restaurant_id,
      message: 'Image extraction retry started'
    });

  } catch (error) {
    console.error('Retry image extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Run image extraction in background
 */
async function runImageExtraction(restaurantId: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient();

  try {
    // Create image extractor with progress callback
    const imageExtractor = new ImageExtractor(async (progress) => {
      try {
        // Get current job progress
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('job_progress')
          .eq('id', restaurantId)
          .single();

        if (restaurant) {
          const jobProgress = restaurant.job_progress || {};

          // Update image progress
          jobProgress['process_images'] = {
            ...jobProgress['process_images'],
            status: 'running',
            images_processed: progress.current,
            images_total: progress.total,
            current_cost: progress.cost,
            current_phase: progress.phase
          };

          await supabase
            .from('restaurants')
            .update({ job_progress: jobProgress })
            .eq('id', restaurantId);
        }
      } catch (error) {
        console.error('[Background] Failed to update image progress:', error);
      }
    });

    // Extract images
    const result = await imageExtractor.extractImages(restaurantId);

    // Update step status
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('job_progress')
      .eq('id', restaurantId)
      .single();

    if (restaurant) {
      const jobProgress = restaurant.job_progress || {};

      jobProgress['process_images'] = {
        ...jobProgress['process_images'],
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        error: result.success ? null : 'Image extraction failed'
      };

      await supabase
        .from('restaurants')
        .update({ job_progress: jobProgress })
        .eq('id', restaurantId);
    }

    console.log(`[Background] Image extraction completed for restaurant ${restaurantId}`);

  } catch (error) {
    console.error(`[Background] Image extraction failed for restaurant ${restaurantId}:`, error);

    // Mark step as failed
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('job_progress')
      .eq('id', restaurantId)
      .single();

    if (restaurant) {
      const jobProgress = restaurant.job_progress || {};

      jobProgress['process_images'] = {
        ...jobProgress['process_images'],
        status: 'failed',
        completed_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Image extraction failed'
      };

      await supabase
        .from('restaurants')
        .update({ job_progress: jobProgress })
        .eq('id', restaurantId);
    }
  }
}
