
import { adminDb } from '@/lib/firebase/admin'
import { GOA_DISTRICTS, getAreasByDistrict } from '@/lib/utils/goa-locations'

// Computed Districts with Areas
const goaDistricts = [
  {
    id: 'north-goa',
    name: GOA_DISTRICTS.NORTH_GOA,
    slug: 'north-goa',
    areas: getAreasByDistrict(GOA_DISTRICTS.NORTH_GOA)
  },
  {
    id: 'south-goa',
    name: GOA_DISTRICTS.SOUTH_GOA,
    slug: 'south-goa',
    areas: getAreasByDistrict(GOA_DISTRICTS.SOUTH_GOA)
  }
];

/**
 * Get top-rated hotels (8.0+ rating)
 */
export async function getTopRatedHotels(limit: number = 8) {
  if (!adminDb) return []

  try {
    const snap = await adminDb.collection('hotels')
      .where('active', '==', true)
      .where('extraction_status', '==', 'completed')
      .where('bok_score', '>=', 7.0) // This requires Composite Index probably
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map(doc => ({
      ...doc.data(),
      categories: [] // Stub
    }));
  } catch (e) {
    console.error('Error top hotels', e);
    return [];
  }
}

/**
 * Get luxury hotels (5-star and high-end)
 */
export async function getLuxuryHotels(limit: number = 8) {
  if (!adminDb) return []
  try {
    const snap = await adminDb.collection('hotels')
      .where('active', '==', true)
      .where('extraction_status', '==', 'completed')
      .where('star_rating', '>=', 5)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(doc => ({ ...doc.data(), categories: [] }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get budget-friendly hotels (3-star and below)
 */
export async function getBudgetFriendlyHotels(limit: number = 8) {
  if (!adminDb) return []
  try {
    const snap = await adminDb.collection('hotels')
      .where('active', '==', true)
      .where('extraction_status', '==', 'completed')
      .where('star_rating', '<=', 3)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(doc => ({ ...doc.data(), categories: [] }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get all hotel categories with counts
 */
export async function getAllCategoriesWithCounts() {
  if (!adminDb) return []
  try {
    const catSnap = await adminDb.collection('hotel_categories').orderBy('display_order').get();
    const categories = catSnap.docs.map(d => d.data());

    const results = await Promise.all(categories.map(async (cat) => {
      const countSnap = await adminDb!
        .collection('hotels')
        .where('active', '==', true)
        .where('hotel_category_ids', 'array-contains', cat.id)
        .count()
        .get();

      return {
        ...cat,
        count: countSnap.data().count
      };
    }));
    return results;
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get governorates with hotel statistics
 */
export async function getGovernoratesWithHotelStats() {
  if (!adminDb) return []

  // Using Goa districts instead of Goa governorates
  return await Promise.all(goaDistricts.map(async (dist) => {
    let count = 0;

    // Chunk areas
    const chunks = [];
    for (let i = 0; i < dist.areas.length; i += 10) {
      chunks.push(dist.areas.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snap = await adminDb!
        .collection('hotels')
        .where('active', '==', true)
        .where('area', 'in', chunk)
        .count()
        .get();
      count += snap.data().count;
    }

    return {
      ...dist,
      hotelCount: count
    };
  }));
}

/**
 * Get total hotel count
 */
export async function getTotalHotelCount() {
  if (!adminDb) return 0;
  const snap = await adminDb.collection('hotels').where('active', '==', true).where('extraction_status', '==', 'completed').count().get();
  return snap.data().count;
}

/**
 * Get all hotels for comprehensive directory listing
 */
export async function getAllHotels() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('hotels')
    .where('active', '==', true)
    .where('extraction_status', '==', 'completed')
    .orderBy('name', 'asc')
    .select('id', 'slug', 'name', 'area', 'bok_score', 'google_rating')
    .get();
  return snap.docs.map(d => d.data());
}
