import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const cuisine = searchParams.get('cuisine');
  const area = searchParams.get('area');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query && !cuisine && !area) {
    // If no filters, return top rated
    // Or just return empty if query is required logic, but original allowed filtering
  }

  // Basic validation only if query is present
  if (query && query.length < 2) {
    return NextResponse.json({
      results: [],
      message: 'Query must be at least 2 characters'
    });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Data source unavailable' }, { status: 500 });
  }

  const db = adminDb;
  const lowerQuery = query ? query.toLowerCase() : '';

  try {
    let firestoreQuery = db.collection('restaurants').orderBy('overall_rating', 'desc');

    if (cuisine) {
      // Firestore requires indexes for array-contains + orderBy usually
      // We might fail here without index, but let's try
      firestoreQuery = firestoreQuery.where('restaurant_cuisine_ids', 'array-contains', cuisine);
    }

    if (area) {
      firestoreQuery = firestoreQuery.where('area', '==', area);
    }

    // Since we can't do text search in Firestore easily combined with other filters efficiently
    // without a dedicated solution, we will fetch chunks or limits and filter in memory if query exists.

    // Strategy: Fetch more than limit, filter, then slice.
    const snapshot = await firestoreQuery.limit(50).get();
    const allDocs = snapshot.docs.map(doc => doc.data());

    let filtered = allDocs;
    if (query) {
      filtered = allDocs.filter(d =>
        d.name?.toLowerCase().includes(lowerQuery) ||
        d.description?.toLowerCase().includes(lowerQuery) ||
        d.area?.toLowerCase().includes(lowerQuery)
      );
    }

    const results = filtered.slice(0, limit);

    // Populate cuisines
    // We can skip this if frontend doesn't strictly need names, but let's try to keep compatibility
    // Fetch cuisines if any
    let resultWithCuisines = results;

    // Helper to get cuisine names (cached or batched in real app)
    // For now, strict compatibility:
    const cuisineIds = new Set<string>();
    results.forEach(r => {
      if (r.restaurant_cuisine_ids) r.restaurant_cuisine_ids.forEach((id: any) => cuisineIds.add(String(id)));
    });

    if (cuisineIds.size > 0) {
      const ids = Array.from(cuisineIds);
      // Batch fetch (chunks of 10)
      const cuisineMap = new Map();
      for (let i = 0; i < ids.length; i += 10) {
        const chunk = ids.slice(i, i + 10);
        const snap = await db.collection('restaurants_cuisines').where('id', 'in', chunk).get();
        snap.forEach(d => cuisineMap.set(String(d.data().id), d.data()));
      }

      resultWithCuisines = results.map(r => ({
        ...r,
        cuisines: (r.restaurant_cuisine_ids || []).map((id: any) => cuisineMap.get(String(id))).filter(Boolean)
      }));
    }

    return NextResponse.json({
      results: resultWithCuisines,
      count: resultWithCuisines.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    );
  }
}
