import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { hotelExtractionOrchestrator } from '@/lib/services/hotel-extraction-orchestrator';

/**
 * POST /api/admin/hotels/start-extraction
 *
 * Starts hotel extraction process for a given Google Place ID
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

    // Check for existing hotel with this place_id (unless override)
    const { data: existing } = await supabase
      .from('hotels')
      .select('id, name, extraction_status')
      .eq('google_place_id', place_id)
      .single();

    if (existing) {
      if (!override) {
        return NextResponse.json({
          error: 'Hotel already exists',
          hotel_id: existing.id,
          hotel_name: existing.name,
          extraction_status: existing.extraction_status,
          exists: true
        }, { status: 409 });
      }

      // Override mode: Delete existing hotel and related data
      console.log(`[StartExtraction] Override mode: Deleting existing hotel ${existing.id}`);

      // Delete related records first (foreign key constraints)
      await supabase.from('hotel_rooms').delete().eq('hotel_id', existing.id);
      await supabase.from('hotel_faqs').delete().eq('hotel_id', existing.id);
      await supabase.from('hotel_images').delete().eq('hotel_id', existing.id);

      // Delete the hotel record
      const { error: deleteError } = await supabase
        .from('hotels')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('[StartExtraction] Failed to delete existing hotel:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete existing hotel for re-extraction' },
          { status: 500 }
        );
      }

      console.log(`[StartExtraction] Successfully deleted hotel ${existing.id} for re-extraction`);
    }

    // Generate slug from name and area
    const hotelName = place_data?.name || search_query || 'hotel';
    const baseSlug = hotelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Extract and slugify area name
    const areaName = place_data?.vicinity || place_data?.formatted_address?.split(',')[1]?.trim() || 'Goa';
    const areaSlug = areaName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create hotel record
    const { data: hotel, error: createError } = await supabase
      .from('hotels')
      .insert({
        name: hotelName,
        slug: `${baseSlug}-${areaSlug}`, // Slug with area suffix
        google_place_id: place_id,
        address: place_data?.formatted_address || place_data?.vicinity || 'Goa',
        area: areaName,
        extraction_status: 'pending',
        extraction_source: 'manual',
        extraction_progress: {
          initial_creation: {
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        }
      })
      .select()
      .single();

    if (createError || !hotel) {
      console.error('[StartExtraction] Failed to create hotel:', createError);
      return NextResponse.json(
        { error: 'Failed to create hotel record' },
        { status: 500 }
      );
    }

    console.log(`[StartExtraction] Created hotel ${hotel.id} - Starting extraction`);

    // Start extraction in background (don't await)
    hotelExtractionOrchestrator.executeExtraction({
      hotelId: hotel.id,
      placeId: place_id,
      searchQuery: search_query,
      placeData: place_data
    }).catch(error => {
      console.error(`[StartExtraction] Extraction failed for hotel ${hotel.id}:`, error);
    });

    return NextResponse.json({
      success: true,
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      message: 'Hotel extraction started'
    });

  } catch (error) {
    console.error('[StartExtraction] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
