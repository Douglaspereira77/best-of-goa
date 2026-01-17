
import { adminDb } from '@/lib/firebase/admin'

/**
 * Get hotels by category slug
 * Uses array-based hotel_category_ids pattern
 */
export async function getHotelsByCategory(categorySlug: string, limit?: number) {
  if (!adminDb) return []

  try {
    // First, get the category ID from the slug
    const catSnap = await adminDb.collection('hotel_categories').where('slug', '==', categorySlug).limit(1).get();
    if (catSnap.empty) return [];
    const category = catSnap.docs[0].data();

    // Now fetch hotels that contain this category ID in their array
    let query = adminDb.collection('hotels')
      .where('active', '==', true)
      .where('extraction_status', '==', 'completed')
      .where('hotel_category_ids', 'array-contains', category.id)
      .orderBy('bok_score', 'desc');

    if (limit) query = query.limit(limit);

    const snap = await query.get();

    return snap.docs.map(doc => ({
      ...doc.data(),
      categories: [{ id: category.id, name: category.name, slug: category.slug }]
    }));
  } catch (error) {
    console.error('Error fetching hotels by category:', error)
    return []
  }
}

/**
 * Get category information by slug
 */
export async function getCategoryBySlug(slug: string) {
  if (!adminDb) return null
  try {
    const catSnap = await adminDb.collection('hotel_categories').where('slug', '==', slug).limit(1).get()
    if (catSnap.empty) return null;
    const category = catSnap.docs[0].data();

    // Count hotels
    const countSnap = await adminDb.collection('hotels')
      .where('active', '==', true)
      .where('extraction_status', '==', 'completed')
      .where('hotel_category_ids', 'array-contains', category.id)
      .count()
      .get();

    return {
      ...category,
      count: countSnap.data().count
    }
  } catch (e) { console.error(e); return null; }
}

/**
 * Get all hotel categories with hotel counts
 */
export async function getAllHotelCategories() {
  if (!adminDb) return []
  try {
    const catSnap = await adminDb.collection('hotel_categories').orderBy('display_order', 'asc').get();
    const categories = catSnap.docs.map(d => d.data());

    const results = await Promise.all(categories.map(async (cat: any) => {
      const countSnap = await adminDb!.collection('hotels')
        .where('active', '==', true)
        .where('extraction_status', '==', 'completed')
        .where('hotel_category_ids', 'array-contains', cat.id)
        .count().get();
      return { ...cat, count: countSnap.data().count };
    }));
    return results;
  } catch (e) { console.error(e); return []; }
}
