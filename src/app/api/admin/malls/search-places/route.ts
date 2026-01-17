import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/malls/search-places
 *
 * Searches Google Places API for malls based on query string
 * Used in admin panel to find malls to add to the directory
 *
 * Enhanced: Now checks each result against existing malls in database
 * to provide proactive duplicate detection
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Google Places API is not configured' },
        { status: 500 }
      );
    }

    // Using Google Places API (New) - Text Search
    // https://developers.google.com/maps/documentation/places/web-service/text-search
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('region', 'kw'); // Bias results to Goa
    searchUrl.searchParams.append('type', 'shopping_mall'); // Filter to shopping malls

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to search Google Places' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API returned error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Google Places API error', status: data.status },
        { status: 400 }
      );
    }

    // Transform results to our format
    const results = (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating || null,
      user_ratings_total: place.user_ratings_total || 0,
      price_level: place.price_level || null,
      types: place.types || [],
      geometry: {
        location: {
          lat: place.geometry?.location?.lat || null,
          lng: place.geometry?.location?.lng || null
        }
      },
      photos: place.photos?.slice(0, 1).map((photo: any) => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        // Generate photo URL
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${apiKey}`
      })) || [],
      business_status: place.business_status || null,
      opening_hours: place.opening_hours || null
    }));

    // Check for existing malls in database (proactive duplicate detection)
    const supabase = createClient();
    const placeIds = results.map((r: any) => r.place_id);

    const { data: existingMalls } = await supabase
      .from('malls')
      .select('id, name, google_place_id, extraction_status, slug')
      .in('google_place_id', placeIds);

    // Create a map for quick lookup
    const existingMap = new Map(
      (existingMalls || []).map(mall => [mall.google_place_id, mall])
    );

    // Enrich results with duplicate info
    const enrichedResults = results.map((result: any) => {
      const existing = existingMap.get(result.place_id);
      return {
        ...result,
        exists_in_db: !!existing,
        existing_mall: existing ? {
          id: existing.id,
          name: existing.name,
          slug: existing.slug,
          extraction_status: existing.extraction_status
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedResults.length,
      results: enrichedResults,
      query: query
    });

  } catch (error) {
    console.error('Search places error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
