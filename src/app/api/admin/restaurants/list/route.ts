import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/admin/restaurants/list
 *
 * Fetches all restaurants with basic info for admin list view
 * Simpler than queue endpoint - focuses on entity management
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      );
    }

    // For the admin list, we'll fetch a larger set and filter in memory to support
    // complex status combinations and name searching without many indexes.
    const snapshot = await adminDb.collection('restaurants')
      .orderBy('created_at', 'desc')
      .limit(500)
      .get();

    let allRestaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any
    }));

    // Apply status filter in memory
    if (status !== 'all') {
      if (status === 'draft') {
        // Draft = active status but not verified
        allRestaurants = allRestaurants.filter(r => r.status === 'active' && !r.verified);
      } else if (status === 'published') {
        // Published = active status and verified
        allRestaurants = allRestaurants.filter(r => r.status === 'active' && r.verified);
      } else if (status === 'failed') {
        allRestaurants = allRestaurants.filter(r => r.status === 'failed');
      } else if (status === 'processing') {
        allRestaurants = allRestaurants.filter(r => r.status === 'processing' || r.status === 'importing');
      }
    }

    // Apply search filter in memory
    if (search) {
      const lowerSearch = search.toLowerCase();
      allRestaurants = allRestaurants.filter(r =>
        r.name?.toLowerCase().includes(lowerSearch) ||
        r.slug?.toLowerCase().includes(lowerSearch)
      );
    }

    const totalCount = allRestaurants.length;
    const paginatedResults = allRestaurants.slice(offset, offset + limit);

    // Transform data for frontend
    const listItems = paginatedResults.map(restaurant => {
      // Determine display status
      let displayStatus = 'draft';
      if (restaurant.status === 'processing' || restaurant.status === 'importing') {
        displayStatus = 'processing';
      } else if (restaurant.status === 'failed') {
        displayStatus = 'failed';
      } else if (restaurant.status === 'active' && restaurant.verified) {
        displayStatus = 'published';
      } else if (restaurant.status === 'active' && !restaurant.verified) {
        displayStatus = 'draft';
      }

      return {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: displayStatus,
        area: restaurant.area || 'Unknown',
        rating: restaurant.google_rating,
        reviewCount: restaurant.google_review_count,
        heroImage: restaurant.hero_image,
        createdAt: restaurant.created_at,
        updatedAt: restaurant.updated_at
      }
    });

    return NextResponse.json({
      success: true,
      restaurants: listItems,
      pagination: {
        limit,
        offset,
        total: totalCount
      }
    });

  } catch (error) {
    console.error('Restaurant list fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
