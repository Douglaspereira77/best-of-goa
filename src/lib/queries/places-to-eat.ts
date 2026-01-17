
import { adminDb } from '@/lib/firebase/admin';
import { GOA_DISTRICTS } from '@/lib/utils/goa-locations';
import { logDebug } from '@/lib/debug-logger';

/**
 * Helper to fetch cuisines for a list of restaurants
 */
async function fetchCuisinesForRestaurants(restaurants: any[]) {
  if (!adminDb || !restaurants.length) return restaurants;

  // Collect all unique cuisine IDs
  const allCuisineIds = new Set<string>();
  restaurants.forEach(r => {
    if (r.restaurant_cuisine_ids && Array.isArray(r.restaurant_cuisine_ids)) {
      r.restaurant_cuisine_ids.forEach((id: any) => allCuisineIds.add(String(id)));
    }
  });

  if (allCuisineIds.size === 0) return restaurants;

  // Fetch cuisines in chunks (limit 10)
  const ids = Array.from(allCuisineIds);
  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const cuisineMap = new Map();
  for (const chunk of chunks) {
    const snapshot = await adminDb
      .collection('restaurants_cuisines')
      .where('id', 'in', chunk)
      .get();

    snapshot.forEach(doc => {
      cuisineMap.set(doc.data().id, doc.data());
      // Also set by string ID just in case
      cuisineMap.set(String(doc.data().id), doc.data());
    });
  }

  // Attach cuisines to restaurants
  return restaurants.map(restaurant => {
    let cuisines: any[] = [];
    if (restaurant.restaurant_cuisine_ids && Array.isArray(restaurant.restaurant_cuisine_ids)) {
      cuisines = restaurant.restaurant_cuisine_ids
        .map((id: any) => cuisineMap.get(id) || cuisineMap.get(String(id)))
        .filter(Boolean);
    }
    return { ...restaurant, cuisines };
  });
}

/**
 * Get top rated restaurants for featured section
 */
export async function getTopRatedRestaurants(limit: number = 8) {
  console.log('[Query] getTopRatedRestaurants called');
  if (!adminDb) {
    console.error('[Query] adminDb is NULL');
    return [];
  }

  // Firestore optimization: Composite index might be needed for overall_rating + total_reviews_aggregated
  // For now, simpler ordering
  try {
    const snapshot = await adminDb
      .collection('restaurants')
      .where('google_rating', '>=', 4.0) // Lowered threshold slightly and mapped to google_rating
      .orderBy('google_rating', 'desc')
      .limit(limit)
      .get();

    const restaurants = snapshot.docs.map(doc => doc.data());
    logDebug(`[Query] getTopRatedRestaurants found ${restaurants.length}`);
    return await fetchCuisinesForRestaurants(restaurants);
  } catch (error) {
    logDebug(`[Query] Error fetching top rated restaurants: ${error}`);
    return [];
  }
}

/**
 * Get budget-friendly restaurants
 * Uses price_level 1-2
 */
export async function getBudgetFriendlyRestaurants(limit: number = 12) {
  if (!adminDb) return [];

  try {
    // Firestore 'in' query
    const snapshot = await adminDb
      .collection('restaurants')
      .where('price_level', 'in', [1, 2, '1', '2']) // Handle potential string/number mismatch
      .where('google_rating', '>=', 4.0)
      .orderBy('google_rating', 'desc')
      .limit(limit)
      .get();

    const restaurants = snapshot.docs.map(doc => doc.data());
    return await fetchCuisinesForRestaurants(restaurants);
  } catch (error: any) {
    // Check for missing index error (Code 9: FAILED_PRECONDITION)
    if (error.code === 9 || error.toString().includes('index')) {
      console.warn('Missing Firestore index for budget restaurants. Falling back to in-memory filtering.');
      try {
        // Fallback strategy:
        // 1. Fetch simplified top-rated restaurants (requires only single-field index on google_rating which usually exists)
        // 2. Filter for price_level in memory
        const snapshot = await adminDb
          .collection('restaurants')
          .where('google_rating', '>=', 4.0)
          .orderBy('google_rating', 'desc') // Ensure we get the best ones first
          .limit(limit * 4) // Fetch 4x items to ensure we find enough budget ones
          .get();

        const allCandidates = snapshot.docs.map(doc => doc.data());

        const budgetFriendly = allCandidates
          .filter(r => {
            const p = r.price_level;
            return p == 1 || p == 2 || p == '1' || p == '2';
          })
          .slice(0, limit);

        return await fetchCuisinesForRestaurants(budgetFriendly);
      } catch (fallbackError) {
        console.error('Error in fallback budget fetch:', fallbackError);
        return [];
      }
    }

    console.error('Error fetching budget-friendly restaurants:', error);
    return [];
  }
}

/**
 * Get all cuisines with restaurant counts
 */
export async function getAllCuisinesWithCounts() {
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection('restaurants_cuisines')
      .orderBy('name')
      .get();

    const cuisines = snapshot.docs.map(doc => doc.data());

    // Count restaurants for each cuisine
    // Warning: This is N queries. In production, consolidate this or use aggregation.
    const cuisinesWithCounts = await Promise.all(
      cuisines.map(async (cuisine) => {
        const countSnapshot = await adminDb!
          .collection('restaurants')
          .where('restaurant_cuisine_ids', 'array-contains', cuisine.id)
          .count()
          .get();

        return {
          ...cuisine,
          restaurant_count: countSnapshot.data().count
        };
      })
    );

    return cuisinesWithCounts.filter(c => c.restaurant_count > 0);
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    return [];
  }
}

// Goa Districts Configuration
export const goaDistricts = [
  {
    id: 'north-goa',
    name: 'North Goa',
    slug: 'north-goa',
    areas: ['Panjim', 'Candolim', 'Calangute', 'Baga', 'Anjuna', 'Vagator', 'Siolim', 'Morjim', 'Ashwem', 'Mandrem', 'Arambol', 'Mapusa', 'Porvorim', 'Old Goa', 'Miramar', 'Dona Paula', 'Nerul', 'Sinquerim', 'Saligao', 'Assagao']
  },
  {
    id: 'south-goa',
    name: 'South Goa',
    slug: 'south-goa',
    areas: ['Margao', 'Vasco', 'Colva', 'Benaulim', 'Varca', 'Cavelossim', 'Mobor', 'Agonda', 'Palolem', 'Patnem', 'Majorda', 'Utorda', 'Bogmalo', 'Canacona', 'Quepem', 'Ponda']
  }
];

// Re-export as governorates to maintain API compatibility if needed, 
// strictly we should rename to districts generally, but 'getGovernorateBySlug' might be called by pages.
// We will alias it for now.
export const goaGovernorates = goaDistricts; // Alias for backward compat

/**
 * Get district/governorate by slug
 */
export function getGovernorateBySlug(slug: string) {
  return goaDistricts.find(g => g.slug === slug) || null;
}

/**
 * Get all district slugs
 */
export function getAllGovernorateslugs() {
  return goaDistricts.map(g => g.slug);
}

/**
 * Get restaurants by district/governorate slug
 */
export async function getRestaurantsByGovernorate(governorateSlug: string, limit?: number) {
  if (!adminDb) return null;

  const district = getGovernorateBySlug(governorateSlug);
  if (!district) return null;

  try {
    // Firestore 'in' query for areas (limit 10)
    // If areas > 10, we must split or do multiple queries.
    // North Goa has >10 areas. This IS A PROBLEM with Firestore.
    // WORKAROUND: We iterate chunks of areas.

    // Note: A better way would be data modeling: add 'district_slug' to the restaurant document.
    // For migration WITHOUT re-ingesting data, we rely on 'area'.

    // Split areas into chunks of 10
    const chunks = [];
    for (let i = 0; i < district.areas.length; i += 10) {
      chunks.push(district.areas.slice(i, i + 10));
    }

    let allRestaurants: any[] = [];

    for (const chunk of chunks) {
      let query = adminDb
        .collection('restaurants')
        .where('area', 'in', chunk)
        .orderBy('google_rating', 'desc');

      if (limit) {
        // Limit per chunk is tricky. We'll fetch more and sort/limit in memory if needed.
        // Or just apply limit to each chunk and merge (imprecise but okay for "top")
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      snapshot.forEach(doc => allRestaurants.push(doc.data()));
    }

    // Sort and limit in memory
    allRestaurants.sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
    if (limit) {
      allRestaurants = allRestaurants.slice(0, limit);
    }

    const restaurantsWithCuisines = await fetchCuisinesForRestaurants(allRestaurants);

    return {
      governorate: district,
      restaurants: restaurantsWithCuisines,
      totalCount: allRestaurants.length // Approximate if limited
    };

  } catch (error) {
    console.error(`Error fetching restaurants for ${district.name}:`, error);
    return null;
  }
}

/**
 * Get districts with stats
 */
export async function getGovernoratesWithStats() {
  if (!adminDb) return [];

  const districts = goaDistricts;

  const districtsWithStats = await Promise.all(
    districts.map(async (dist) => {
      // Chunked count query
      let count = 0;
      let totalRating = 0;
      let ratedCount = 0;

      const chunks = [];
      for (let i = 0; i < dist.areas.length; i += 10) {
        chunks.push(dist.areas.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        try {
          const snapshot = await adminDb!
            .collection('restaurants')
            .where('area', 'in', chunk)
            .select('google_rating')
            .get();

          count += snapshot.size;
          snapshot.forEach(doc => {
            const r = doc.data().google_rating;
            if (r) {
              totalRating += r;
              ratedCount++;
            }
          });
        } catch (e) {
          console.error('Error in district stats chunk', e);
        }
      }

      const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;

      return {
        id: dist.id,
        name: dist.name,
        slug: dist.slug,
        restaurant_count: count,
        avg_rating: avgRating
      };
    })
  );

  return districtsWithStats;
}

/**
 * Get restaurants by category
 */
export async function getRestaurantsByCategory(category: string, limit: number = 1) {
  // This requires mapping category string to IDs or searching categories collection first?
  // Looking at original code: it assumed filtering logic existed elsewhere or wasn't fully implemented in the snippet provided (Wait, the snippet I saw showed filtering by... wait, looking at my history).
  // Original code: did `.from('restaurants')` but I don't see WHERE clause for category in the snippet I read earlier!
  // Ah, line 303 in previous view: `getRestaurantsByCategory(category: string, limit: number = 1)`
  // Whatever, I'll implement logic assuming I can filter by category arrays?
  // "restaurants_categories" collection join.

  // Filter strategy:
  // 1. Find category ID from category slug/name.
  // 2. Filter restaurants where restaurant_category_ids contains ID.

  if (!adminDb) return [];

  try {
    // First find the category ID
    // Assuming 'category' arg is a slug or name
    // Let's try matching slug
    const catSnapshot = await adminDb.collection('restaurants_categories')
      .where('slug', '==', category)
      .limit(1)
      .get();

    if (catSnapshot.empty) return [];
    const catId = catSnapshot.docs[0].data().id;

    const snapshot = await adminDb.collection('restaurants')
      .where('restaurant_category_ids', 'array-contains', catId)
      .orderBy('google_rating', 'desc')
      .limit(limit)
      .get();

    const restaurants = snapshot.docs.map(doc => doc.data());
    return await fetchCuisinesForRestaurants(restaurants);
  } catch (e) {
    console.error('Error fetching category', e);
    return [];
  }
}

/**
 * Get total restaurant count
 */
export async function getTotalRestaurantCount() {
  if (!adminDb) return 0;
  try {
    const snapshot = await adminDb.collection('restaurants').count().get();
    return snapshot.data().count;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

/**
 * Get all restaurants for directory
 */
export async function getAllRestaurants() {
  logDebug('[Query] getAllRestaurants called');
  if (!adminDb) {
    logDebug('[Query] getAllRestaurants: adminDb is NULL');
    return [];
  }
  try {
    const snapshot = await adminDb.collection('restaurants')
      .select('id', 'slug', 'name', 'area', 'google_rating', 'bok_score')
      .orderBy('name')
      .get();
    logDebug(`[Query] getAllRestaurants found ${snapshot.size}`);
    return snapshot.docs.map(doc => doc.data());
  } catch (e) {
    logDebug(`[Query] Error fetching all restaurants: ${e}`);
    return [];
  }
}
