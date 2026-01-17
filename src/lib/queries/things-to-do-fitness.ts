
import { adminDb } from '@/lib/firebase/admin'

/**
 * Get top rated fitness places for featured section
 */
export async function getTopRatedFitnessPlaces(limit: number = 8) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('fitness_places')
      .where('active', '==', true)
      .where('bok_score', '>=', 7.0)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Get women-only fitness places
 */
export async function getWomenOnlyFitnessPlaces(limit: number = 8) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('fitness_places')
      .where('active', '==', true)
      .where('gender_policy', '==', 'women-only')
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Get all fitness types with counts from database
 */
export async function getAllFitnessTypesWithCounts() {
  if (!adminDb) return [];
  try {
    const catSnap = await adminDb.collection('fitness_categories').orderBy('display_order', 'asc').get();
    const categories = catSnap.docs.map(d => d.data());

    const results = await Promise.all(categories.map(async (cat: any) => {
      const countSnap = await adminDb!.collection('fitness_places')
        .where('active', '==', true)
        .where('fitness_types', 'array-contains', cat.slug) // Check if match slug or ID? Original code matched slug.
        .count().get();
      return {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        fitness_count: countSnap.data().count
      };
    }));
    return results.filter(c => c.fitness_count > 0);
  } catch (e) { console.error(e); return []; }
}

/**
 * Get areas with stats
 */
export async function getAreasWithStats() {
  if (!adminDb) return [];
  try {
    // Fetch all active fitness places to aggregate in memory (assuming < 1000)
    const snap = await adminDb.collection('fitness_places')
      .where('active', '==', true)
      .select('area', 'google_rating')
      .get();

    const stats: any = {};

    snap.forEach(doc => {
      const data = doc.data();
      const area = data.area;
      if (!stats[area]) stats[area] = { count: 0, totalRating: 0, ratedCount: 0 };

      stats[area].count++;
      if (data.google_rating) {
        stats[area].totalRating += data.google_rating;
        stats[area].ratedCount++;
      }
    });

    return Object.entries(stats).map(([areaName, stat]: [string, any]) => ({
      name: areaName,
      slug: areaName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      fitness_count: stat.count,
      avg_rating: stat.ratedCount > 0 ? stat.totalRating / stat.ratedCount : 0
    })).sort((a, b) => b.fitness_count - a.fitness_count);

  } catch (e) { console.error(e); return []; }
}

/**
 * Get total fitness place count
 */
export async function getTotalFitnessCount() {
  if (!adminDb) return 0;
  const snap = await adminDb.collection('fitness_places').where('active', '==', true).count().get();
  return snap.data().count;
}

/**
 * Get fitness places by type
 */
export async function getFitnessByType(type: string, limit: number = 12) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('fitness_places')
      .where('active', '==', true)
      .where('fitness_types', 'array-contains', type)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

export interface FitnessTypePageData {
  category: {
    id: number
    name: string
    slug: string
    description?: string
    icon?: string
  }
  places: Array<{
    id: string
    slug: string
    name: string
    short_description?: string
    address?: string
    area: string
    hero_image?: string
    bok_score?: number
    bok_score_breakdown?: any
    total_reviews_aggregated?: number
    google_rating?: number
    google_review_count?: number
    fitness_types?: string[]
    gender_policy?: string
    amenities?: any
  }>
  totalCount: number
}

export async function getFitnessPlacesByType(
  typeSlug: string,
  limit: number = 50
): Promise<FitnessTypePageData | null> {
  if (!adminDb) return null;
  try {
    const catSnap = await adminDb.collection('fitness_categories').where('slug', '==', typeSlug).limit(1).get();
    if (catSnap.empty) return null;
    const category = catSnap.docs[0].data();

    const isLadiesOnly = typeSlug === 'ladies-only';
    let query = adminDb.collection('fitness_places').where('active', '==', true);

    if (isLadiesOnly) {
      query = query.where('gender_policy', '==', 'women-only');
    } else {
      query = query.where('fitness_types', 'array-contains', category.slug);
    }

    const snap = await query.orderBy('bok_score', 'desc').limit(limit).get();

    return {
      // @ts-ignore
      category,
      // @ts-ignore
      places: snap.docs.map(d => d.data()),
      totalCount: snap.size
    };

  } catch (e) { console.error(e); return null; }
}

/**
 * Get fitness places by area
 */
export async function getFitnessByArea(area: string, limit: number = 12) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('fitness_places')
      .where('active', '==', true)
      .where('area', '==', area)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Get ALL fitness places
 */
export async function getAllFitnessPlacesForListing() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('fitness_places')
    .where('active', '==', true)
    .orderBy('name', 'asc')
    .select('id', 'slug', 'name', 'area', 'bok_score', 'google_rating', 'fitness_types', 'gender_policy')
    .get();
  return snap.docs.map(d => d.data());
}
