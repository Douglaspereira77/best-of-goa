
/**
 * Cuisine Category Pages - Database Queries
 *
 * Queries for cuisine/category listing pages that rank for commercial queries
 * like "best sushi goa", "italian restaurants goa city"
 *
 * Refactored for Firebase Firestore
 */

import { adminDb } from '@/lib/firebase/admin';

export interface CuisinePageData {
  cuisine: {
    id: string;
    name: string;
    slug: string;
    name_ar?: string;
    description?: string;
    icon?: string;
  };
  restaurants: Array<{
    id: string;
    slug: string;
    name: string;
    name_ar?: string;
    description?: string;
    short_description?: string;
    address: string;
    area: string;
    hero_image?: string;
    overall_rating?: number;
    total_reviews_aggregated?: number;
    price_level: number;
    currency: string;
    restaurant_cuisine_ids?: string[]; // Note: stored as strings/numbers in array
    cuisines?: Array<{ id: string; name: string; slug: string }>;
  }>;
  totalCount: number;
}

// Helper
async function fetchByIds(collection: string, ids: any[]) {
  if (!adminDb || !ids || ids.length === 0) return [];
  const strIds = ids.map(String);
  const chunks = [];
  for (let i = 0; i < strIds.length; i += 10) {
    chunks.push(strIds.slice(i, i + 10));
  }
  const results = [];
  for (const chunk of chunks) {
    const snap = await adminDb.collection(collection).where('id', 'in', chunk).get();
    snap.forEach(doc => results.push(doc.data()));
  }
  return results;
}

/**
 * Get all restaurants for a specific cuisine
 */
export async function getRestaurantsByCuisine(
  cuisineSlug: string,
  limit: number = 50
): Promise<CuisinePageData | null> {
  if (!adminDb) return null;

  try {
    // Step 1: Get cuisine details
    const cSnap = await adminDb.collection('restaurants_cuisines').where('slug', '==', cuisineSlug).limit(1).get();
    if (cSnap.empty) return null;
    const cuisine = cSnap.docs[0].data();

    // Step 2: Get all restaurants with this cuisine
    // Use array-contains
    const rSnap = await adminDb.collection('restaurants')
      .where('restaurant_cuisine_ids', 'array-contains', cuisine.id)
      .orderBy('overall_rating', 'desc')
      .limit(limit)
      .get();

    const restaurants = rSnap.docs.map(d => d.data());

    // Step 3: Resolve relationships
    const restaurantsWithCuisines = await Promise.all(restaurants.map(async (r: any) => {
      const cuisines = await fetchByIds('restaurants_cuisines', r.restaurant_cuisine_ids || []);
      return {
        ...r,
        cuisines
      };
    }));

    return {
      // @ts-ignore
      cuisine,
      // @ts-ignore
      restaurants: restaurantsWithCuisines,
      totalCount: rSnap.size // Approximate or actual fetched count
    };

  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Get restaurants filtered by cuisine AND neighborhood
 */
export async function getRestaurantsByCuisineAndNeighborhood(
  cuisineSlug: string,
  neighborhoodSlug?: string,
  limit: number = 50
): Promise<CuisinePageData | null> {
  if (!adminDb) return null;

  try {
    // Get cuisine
    const cSnap = await adminDb.collection('restaurants_cuisines').where('slug', '==', cuisineSlug).limit(1).get();
    if (cSnap.empty) return null;
    const cuisine = cSnap.docs[0].data();

    let query = adminDb.collection('restaurants')
      .where('restaurant_cuisine_ids', 'array-contains', cuisine.id);

    if (neighborhoodSlug) {
      const nSnap = await adminDb.collection('restaurant_neighborhoods').where('slug', '==', neighborhoodSlug).limit(1).get();
      if (!nSnap.empty) {
        const nid = nSnap.docs[0].data().id;
        query = query.where('neighborhood_id', '==', nid);
      }
    }

    const rSnap = await query.orderBy('overall_rating', 'desc').limit(limit).get();
    const restaurants = rSnap.docs.map(d => d.data());

    const restaurantsWithCuisines = await Promise.all(restaurants.map(async (r: any) => {
      const cuisines = await fetchByIds('restaurants_cuisines', r.restaurant_cuisine_ids || []);
      return { ...r, cuisines };
    }));

    return {
      // @ts-ignore
      cuisine,
      // @ts-ignore
      restaurants: restaurantsWithCuisines,
      totalCount: rSnap.size
    };

  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Get all cuisines with restaurant counts
 */
export async function getAllCuisinesWithCounts(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    restaurantCount: number;
  }>
> {
  if (!adminDb) return [];
  try {
    const cSnap = await adminDb.collection('restaurants_cuisines').orderBy('display_order', 'asc').get();
    const cuisines = cSnap.docs.map(d => d.data());

    const results = await Promise.all(cuisines.map(async (c: any) => {
      const countSnap = await adminDb!.collection('restaurants')
        .where('restaurant_cuisine_ids', 'array-contains', c.id)
        .count().get();
      return {
        ...c,
        restaurantCount: countSnap.data().count
      };
    }));

    return results.filter(c => c.restaurantCount > 0);
  } catch (e) {
    console.error(e);
    return [];
  }
}
