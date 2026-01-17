import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/admin/restaurants/[id]
 * Fetches a single restaurant's details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    if (!adminDb) return NextResponse.json({ error: 'Database connection error' }, { status: 500 });

    // Try by ID (which is usually the slug)
    let doc = await adminDb.collection('restaurants').doc(restaurantId).get();

    // Fallback search by slug field if not found by ID
    if (!doc.exists) {
      const snap = await adminDb.collection('restaurants').where('slug', '==', restaurantId).limit(1).get();
      if (!snap.empty) doc = snap.docs[0];
    }

    if (!doc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/restaurants/[id]
 * Updates a restaurant's details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    if (!adminDb) return NextResponse.json({ error: 'Database connection error' }, { status: 500 });

    const body = await request.json();

    // Defined allowed fields to prevent accidental overwrites of system fields
    const allowedFields = [
      'name', 'slug', 'cuisine', 'address', 'neighborhood', 'phone',
      'coordinates', 'price_level', 'website', 'instagram', 'facebook',
      'hours', 'status', 'description', 'thumbnail_url', 'verified', 'active',
      'area', 'district', 'latitude', 'longitude', 'google_rating', 'google_review_count'
    ];

    const updateData: any = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    updateData.updated_at = new Date().toISOString();

    // Update restaurant doc
    // Use slug as ID logic from start-extraction
    await adminDb.collection('restaurants').doc(restaurantId).update(updateData);

    const updatedDoc = await adminDb.collection('restaurants').doc(restaurantId).get();

    return NextResponse.json({
      success: true,
      restaurant: { id: updatedDoc.id, ...updatedDoc.data() }
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/restaurants/[id]
 * Deletes a restaurant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    if (!adminDb) return NextResponse.json({ error: 'Database connection error' }, { status: 500 });

    // Delete the main restaurant document
    await adminDb.collection('restaurants').doc(restaurantId).delete();

    // Note: Future cleanup of subcollections or related docs (images, reviews) should be added here
    // if they are moved to Firestore in the future.

    return NextResponse.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}