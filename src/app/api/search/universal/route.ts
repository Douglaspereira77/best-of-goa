import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({
      restaurants: { results: [], total: 0 },
      hotels: { results: [], total: 0 },
      malls: { results: [], total: 0 },
      attractions: { results: [], total: 0 },
      schools: { results: [], total: 0 },
      fitness: { results: [], total: 0 },
      totalResults: 0,
      message: 'Query must be at least 2 characters'
    });
  }

  if (!adminDb) return NextResponse.json({ error: 'Data source unavailable' }, { status: 500 });
  const lowerQuery = query.toLowerCase();

  try {
    // Parallel fetch from all major collections
    const collections = ['restaurants', 'hotels', 'malls', 'attractions', 'schools', 'fitness_places'];

    const results = await Promise.all(collections.map(async (col) => {
      const snapshot = await adminDb.collection(col).where('active', '==', true).limit(50).get();
      const docs = snapshot.docs.map(doc => doc.data());

      const matched = docs.filter(d =>
        (d.name?.toLowerCase().includes(lowerQuery)) ||
        (d.description?.toLowerCase().includes(lowerQuery)) ||
        (d.short_description?.toLowerCase().includes(lowerQuery)) ||
        (d.area?.toLowerCase().includes(lowerQuery))
      ).slice(0, 5); // Return top 5 matches per category

      return {
        collection: col,
        results: matched.map(m => ({
          id: m.id,
          slug: m.slug,
          name: m.name,
          short_description: m.short_description || m.description?.substring(0, 100),
          area: m.area,
          hero_image: m.hero_image || m.images?.[0] || null,
          rating: m.google_rating || m.overall_rating || null,
          type: col === 'fitness_places' ? 'fitness' : col.slice(0, -1) // simple singular
        })),
        total: matched.length
      };
    }));

    const searchData: any = {};
    let totalResults = 0;

    results.forEach(r => {
      const key = r.collection === 'fitness_places' ? 'fitness' : r.collection;
      searchData[key] = { results: r.results, total: r.total };
      totalResults += r.total;
    });

    return NextResponse.json({
      ...searchData,
      totalResults
    });

  } catch (error) {
    console.error('Universal search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
