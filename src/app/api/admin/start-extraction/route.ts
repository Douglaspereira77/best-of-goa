import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
// import { extractionOrchestrator } from '@/lib/services/extraction-orchestrator';
import { generateRestaurantSlugWithArea, extractLocationForSlug } from '@/lib/utils/slug-generator';

/**
 * POST /api/admin/start-extraction
 *
 * Creates a new restaurant record immediately and triggers background extraction
 * Returns restaurant ID for frontend to poll progress
 */
export async function POST(request: NextRequest) {
  try {
    const { place_id, search_query, place_data, override } = await request.json();

    if (!place_id || typeof place_id !== 'string') {
      return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    // Check if restaurant already exists in Firestore
    const existingSnap = await adminDb.collection('restaurants')
      .where('google_place_id', '==', place_id)
      .limit(1)
      .get();

    const existingRestaurant = existingSnap.empty ? null : { id: existingSnap.docs[0].id, ...existingSnap.docs[0].data() as any };

    if (existingRestaurant && !override) {
      if (existingRestaurant.status === 'importing' || existingRestaurant.status === 'processing') {
        return NextResponse.json({
          error: 'Import already in progress for this restaurant',
          restaurant_id: existingRestaurant.id,
          status: existingRestaurant.status
        }, { status: 409 });
      }

      return NextResponse.json({
        error: 'Restaurant already exists',
        duplicate: true,
        restaurant: existingRestaurant
      }, { status: 409 });
    }

    if (existingRestaurant && override) {
      console.log(`[API] Override requested - deleting existing restaurant ${existingRestaurant.id}`);
      await adminDb.collection('restaurants').doc(existingRestaurant.id).delete();
    }

    const restaurantName = place_data?.name || search_query || 'Unknown Restaurant';
    const address = place_data?.formatted_address || '';

    const extractArea = (address: string): string => {
      if (!address) return 'Goa';
      const location = extractLocationForSlug(address);
      if (location === 'goa') {
        const parts = address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          return parts[parts.length - 2].replace(/\s*\d{5}\s*$/, '').trim() || 'Goa';
        }
        return parts[0] || 'Goa';
      }
      return location.charAt(0).toUpperCase() + location.slice(1);
    };

    const area = extractArea(address);

    // Neighborhood mapping
    const mapAreaToNeighborhoodId = (area: string, address?: string): string | null => {
      if (address) {
        const normalizedAddress = address.toLowerCase();
        const landmarkMappings: Record<string, string> = {
          'the avenues': 'avenues',
          '360 mall': '360-mall',
          'marina mall': 'marina-mall',
          'al kout': 'al-kout',
          'murouj': 'murouj',
          'rai': 'al-rai',
          'bidaa': 'al-bidaa',
        };

        for (const [keyword, id] of Object.entries(landmarkMappings)) {
          if (normalizedAddress.includes(keyword)) return id;
        }
      }

      const standardAreaMappings: Record<string, string> = {
        'panjim': 'panjim',
        'calangute': 'calangute',
        'candolim': 'candolim',
        'anjuna': 'anjuna',
        'baga': 'baga',
        'assagao': 'assagao',
        'siolim': 'siolim',
        'mapusa': 'mapusa',
        'porvorim': 'porvorim',
        'margao': 'margao',
        'colva': 'colva',
        'benaulim': 'benaulim',
        'vasco': 'vasco',
      };

      return standardAreaMappings[area.toLowerCase().trim()] || null;
    };

    const neighborhoodId = mapAreaToNeighborhoodId(area, address);
    let neighborhoodName: string | undefined = undefined;
    let neighborhoodSlug: string | undefined = undefined;

    if (neighborhoodId) {
      const nDoc = await adminDb.collection('neighborhoods').doc(neighborhoodId).get();
      if (nDoc.exists) {
        const nData = nDoc.data();
        neighborhoodName = nData?.name;
        neighborhoodSlug = nData?.slug;
      }
    }

    let slug = generateRestaurantSlugWithArea(restaurantName, area, address, neighborhoodName, neighborhoodSlug);

    // Unique slug check
    const makeSlugUnique = async (baseSlug: string): Promise<string> => {
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (true) {
        const slugSnap = await adminDb.collection('restaurants').where('slug', '==', uniqueSlug).limit(1).get();
        if (slugSnap.empty) return uniqueSlug;
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    };

    slug = await makeSlugUnique(slug);

    // Create restaurant record
    const restaurantData = {
      google_place_id: place_id,
      name: restaurantName,
      slug: slug,
      area: area,
      status: 'importing',
      import_started_at: new Date().toISOString(),
      job_progress: {
        initial_creation: {
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      },
      address: address || '',
      latitude: place_data?.geometry?.location?.lat || null,
      longitude: place_data?.geometry?.location?.lng || null,
      active: false, // Don't show until processed
      updated_at: new Date().toISOString()
    };

    const docRef = adminDb.collection('restaurants').doc(slug); // Use slug as ID for restaurants
    await docRef.set(restaurantData);

    console.log(`[API] Restaurant record created: ${slug} (${restaurantName})`);

    // Dynamic import for orchestrator to avoid build time issues if file is missing
    try {
      const { extractionOrchestrator } = await import('@/lib/services/extraction-orchestrator');
      extractionOrchestrator.executeExtraction({
        restaurantId: slug,
        placeId: place_id,
        searchQuery: search_query,
        placeData: place_data
      }).catch((error: any) => {
        console.error('[API] Background extraction error:', error);
      });
      console.log(`[API] Background extraction started for restaurant ${slug}`);
    } catch (e) {
      console.warn('[API] Could not load extractionOrchestrator. Extraction will not run in background.', e);
    }

    return NextResponse.json({
      success: true,
      restaurant_id: slug,
      message: 'Restaurant created and extraction started',
      status: 'importing',
      restaurant: {
        id: slug,
        name: restaurantName,
        slug: slug
      }
    });

  } catch (error) {
    console.error('Start extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
