import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    // In Firebase, the jobId is the restaurant's document ID or slug.
    // Try by document ID first
    let doc = await adminDb.collection('restaurants').doc(jobId).get();

    // If not found by ID, try by slug
    if (!doc.exists) {
      const snap = await adminDb.collection('restaurants').where('slug', '==', jobId).limit(1).get();
      if (!snap.empty) doc = snap.docs[0];
    }

    if (!doc.exists) {
      return NextResponse.json({ error: 'Extraction job not found' }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({
      status: data?.status || 'unknown',
      progress: data?.job_progress || {},
      restaurant_id: doc.id,
      slug: data?.slug,
      updatedAt: data?.updated_at || data?.import_started_at || null
    });

  } catch (error) {
    console.error('Error fetching extraction status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
