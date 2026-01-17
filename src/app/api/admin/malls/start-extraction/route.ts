import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { mallExtractionOrchestrator } from '@/lib/services/mall-extraction-orchestrator';

/**
 * POST /api/admin/malls/start-extraction
 *
 * Starts the extraction process for a mall
 * Creates initial mall record and begins data enrichment
 */
export async function POST(request: NextRequest) {
  try {
    const { place_id, search_query, place_data, override } = await request.json();

    if (!place_id) {
      return NextResponse.json(
        { error: 'place_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if mall already exists
    const { data: existingMall } = await supabase
      .from('malls')
      .select('id, name, extraction_status')
      .eq('google_place_id', place_id)
      .single();

    if (existingMall && !override) {
      return NextResponse.json({
        error: 'Mall already exists',
        exists: true,
        mall_id: existingMall.id,
        mall_name: existingMall.name,
        extraction_status: existingMall.extraction_status
      }, { status: 409 });
    }

    // Generate slug from name
    const slug = generateSlug(place_data?.name || search_query);

    // Extract area from address
    const area = extractArea(place_data?.formatted_address || '');

    // Create or update mall record
    let mallId: string;

    if (existingMall && override) {
      // Update existing mall
      const { error: updateError } = await supabase
        .from('malls')
        .update({
          name: place_data?.name || search_query,
          slug: slug,
          address: place_data?.formatted_address || '',
          area: area,
          latitude: place_data?.geometry?.location?.lat,
          longitude: place_data?.geometry?.location?.lng,
          google_rating: place_data?.rating,
          google_review_count: place_data?.user_ratings_total,
          extraction_status: 'processing',
          extraction_progress: {
            started_at: new Date().toISOString(),
            steps: initializeExtractionSteps()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMall.id);

      if (updateError) {
        throw updateError;
      }

      mallId = existingMall.id;
    } else {
      // Create new mall
      const { data: newMall, error: insertError } = await supabase
        .from('malls')
        .insert({
          google_place_id: place_id,
          name: place_data?.name || search_query,
          slug: slug,
          address: place_data?.formatted_address || '',
          area: area,
          latitude: place_data?.geometry?.location?.lat,
          longitude: place_data?.geometry?.location?.lng,
          google_rating: place_data?.rating,
          google_review_count: place_data?.user_ratings_total,
          extraction_status: 'processing',
          extraction_progress: {
            started_at: new Date().toISOString(),
            steps: initializeExtractionSteps()
          },
          extraction_source: 'discovery_script'
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      mallId = newMall.id;
    }

    // Start FULL extraction process asynchronously using the orchestrator
    // This runs all 12 steps: Apify, Firecrawl, AI enhancement, etc.
    startMallExtraction(mallId, place_id, search_query);

    return NextResponse.json({
      success: true,
      mall_id: mallId,
      message: 'Full extraction started (12 steps)'
    });

  } catch (error) {
    console.error('Start extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to start extraction' },
      { status: 500 }
    );
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractArea(address: string): string {
  // Extract area from Goa address
  // Common patterns: "Area Name, Goa City, Goa"
  const parts = address.split(',').map(p => p.trim());

  // Try to find the area (usually second or third part)
  if (parts.length >= 2) {
    // Skip "Goa" as it's the country
    const filteredParts = parts.filter(p =>
      !p.toLowerCase().includes('goa') ||
      p.toLowerCase().includes('goa city')
    );
    return filteredParts[0] || parts[0] || 'Goa';
  }

  return 'Goa';
}

function initializeExtractionSteps() {
  return [
    { name: 'initial_creation', status: 'completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString() },
    { name: 'apify_fetch', status: 'pending' },
    { name: 'firecrawl_general', status: 'pending' },
    { name: 'firecrawl_stores', status: 'pending' },
    { name: 'firecrawl_website', status: 'pending' },
    { name: 'firecrawl_social_media_search', status: 'pending' },
    { name: 'apify_reviews', status: 'pending' },
    { name: 'firecrawl_tripadvisor', status: 'pending' },
    { name: 'process_images', status: 'pending' },
    { name: 'ai_sentiment', status: 'pending' },
    { name: 'ai_enhancement', status: 'pending' },
    { name: 'data_mapping', status: 'pending' }
  ];
}

async function startMallExtraction(mallId: string, placeId: string, searchQuery: string) {
  // Execute full 12-step extraction pipeline asynchronously
  // This doesn't block the API response - extraction runs in background

  try {
    console.log(`[Mall Extraction] Starting full pipeline for mall ${mallId}`);

    // Create extraction job
    const job = {
      mallId,
      placeId,
      searchQuery,
      startedAt: new Date()
    };

    // Execute the full orchestrator pipeline (runs async)
    mallExtractionOrchestrator.executeExtraction(job).then(() => {
      console.log(`[Mall Extraction] Completed successfully for mall ${mallId}`);
    }).catch((error) => {
      console.error(`[Mall Extraction] Failed for mall ${mallId}:`, error);
    });

  } catch (error) {
    console.error('[Mall Extraction] Failed to start extraction:', error);

    // Update mall status to failed if we can't even start
    const supabase = createClient();
    await supabase
      .from('malls')
      .update({
        extraction_status: 'failed',
        extraction_progress: {
          error: error instanceof Error ? error.message : 'Failed to start extraction',
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', mallId);
  }
}
