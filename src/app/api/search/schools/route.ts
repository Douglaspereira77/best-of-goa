import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], message: 'Query must be at least 2 characters' });
  }

  if (!adminDb) return NextResponse.json({ error: 'Data source unavailable' }, { status: 500 });

  const lowerQuery = query.toLowerCase();

  try {
    const snapshot = await adminDb.collection('schools').where('active', '==', true).limit(100).get();
    const data = snapshot.docs.map(doc => doc.data());

    const filtered = data.filter(d =>
      d.name?.toLowerCase().includes(lowerQuery) ||
      d.description?.toLowerCase().includes(lowerQuery) ||
      d.area?.toLowerCase().includes(lowerQuery) ||
      d.curriculum?.toLowerCase().includes(lowerQuery)
    );

    return NextResponse.json({
      results: filtered.sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0)).slice(0, limit),
      count: filtered.length
    });
  } catch (error) {
    console.error('Schools search error:', error);
    return NextResponse.json({ error: 'Failed to search schools' }, { status: 500 });
  }
}
