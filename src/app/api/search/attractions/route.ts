import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const area = searchParams.get('area');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.length < 2) {
    return NextResponse.json({
      results: [],
      message: 'Query must be at least 2 characters'
    });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Data source unavailable' }, { status: 500 });
  }

  const lowerQuery = query.toLowerCase();

  try {
    // For attractions, we fetch active ones and filter in memory for complex search
    let firestoreQuery = adminDb.collection('attractions').where('active', '==', true);

    if (area) {
      firestoreQuery = firestoreQuery.where('area', '==', area);
    }

    const snapshot = await firestoreQuery.limit(100).get();
    const attractions = snapshot.docs.map(doc => doc.data());

    // In-memory filtering for name/description match
    let filtered = attractions.filter(d =>
      d.name?.toLowerCase().includes(lowerQuery) ||
      d.short_description?.toLowerCase().includes(lowerQuery) ||
      d.area?.toLowerCase().includes(lowerQuery)
    );

    // Fetch categories for filtered results
    const allCategoryIds = new Set<string>();
    filtered.forEach(a => {
      if (a.attraction_category_ids) a.attraction_category_ids.forEach((id: any) => allCategoryIds.add(String(id)));
    });

    const categoryMap = new Map();
    if (allCategoryIds.size > 0) {
      const ids = Array.from(allCategoryIds);
      for (let i = 0; i < ids.length; i += 10) {
        const chunk = ids.slice(i, i + 10);
        const catSnap = await adminDb.collection('attraction_categories').where('id', 'in', chunk).get();
        catSnap.forEach(doc => categoryMap.set(String(doc.data().id), doc.data()));
      }
    }

    const attractionsWithCategories = filtered.map(a => ({
      ...a,
      categories: (a.attraction_category_ids || []).map((id: any) => categoryMap.get(String(id))).filter(Boolean)
    }));

    // Filter by category if provided
    let finalResults = attractionsWithCategories;
    if (category) {
      finalResults = attractionsWithCategories.filter(a =>
        a.categories.some((cat: any) => cat.slug === category || String(cat.id) === String(category))
      );
    }

    // Sort by rating or best match (we'll use rating for now)
    finalResults.sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));

    return NextResponse.json({
      results: finalResults.slice(0, limit),
      count: finalResults.length
    });

  } catch (error) {
    console.error('Attraction search error:', error);
    return NextResponse.json(
      { error: 'Failed to search attractions' },
      { status: 500 }
    );
  }
}