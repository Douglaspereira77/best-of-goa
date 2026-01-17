
import { adminDb } from '@/lib/firebase/admin';
import { GOA_DISTRICTS } from '@/lib/utils/goa-locations';

const goaDistricts = [
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

export const goaGovernorates = goaDistricts; // Backward compatibility alias

// Helper to fetch categories for attractions
async function fetchCategoriesForAttractions(attractions: any[]) {
  if (!adminDb || !attractions.length) return attractions;

  const allCategoryIds = new Set<string>();
  attractions.forEach(a => {
    if (a.attraction_category_ids && Array.isArray(a.attraction_category_ids)) {
      a.attraction_category_ids.forEach((id: any) => allCategoryIds.add(String(id)));
    }
  });

  if (allCategoryIds.size === 0) return attractions;

  const ids = Array.from(allCategoryIds);
  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const categoryMap = new Map();
  for (const chunk of chunks) {
    const snapshot = await adminDb
      .collection('attraction_categories')
      .where('id', 'in', chunk)
      .get();
    snapshot.forEach(doc => {
      categoryMap.set(doc.data().id, doc.data());
      // Also set by string ID
      categoryMap.set(String(doc.data().id), doc.data());
    });
  }

  return attractions.map(attraction => {
    let categories: any[] = [];
    if (attraction.attraction_category_ids && Array.isArray(attraction.attraction_category_ids)) {
      categories = attraction.attraction_category_ids
        .map((id: any) => categoryMap.get(id) || categoryMap.get(String(id)))
        .filter(Boolean);
    }
    return { ...attraction, categories };
  });
}

/**
 * Get top rated attractions for featured section
 */
export async function getTopRatedAttractions(limit: number = 8) {
  if (!adminDb) return [];
  try {
    // Fetch active attractions and sort/filter in memory to avoid index requirement for now
    // In a production app, a composite index on active + bok_score is recommended.
    const snapshot = await adminDb
      .collection('attractions')
      .where('active', '==', true)
      .limit(limit * 5) // Fetch a larger sample
      .get();

    const attractions = snapshot.docs.map(doc => doc.data());

    // Sort by bok_score descending
    attractions.sort((a, b) => (b.bok_score || 0) - (a.bok_score || 0));

    // Filter and slice
    const filteredResults = attractions
      .filter(a => (a.bok_score || 0) >= 7.0)
      .slice(0, limit);

    return await fetchCategoriesForAttractions(filteredResults);
  } catch (error) {
    console.error('Error fetching top attractions', error);
    return [];
  }
}

/**
 * Get family-friendly attractions
 */
export async function getFamilyFriendlyAttractions(limit: number = 12) {
  if (!adminDb) return [];
  try {
    const snapshot = await adminDb
      .collection('attractions')
      .where('active', '==', true)
      .limit(limit * 4) // Fetch extra to filter
      .get();

    let attractions = snapshot.docs.map(doc => doc.data())
      .filter(a => a.age_suitability); // In-memory filtering for not null

    // In-memory sort by bok_score
    attractions.sort((a, b) => (b.bok_score || 0) - (a.bok_score || 0));

    if (attractions.length > limit) attractions = attractions.slice(0, limit);

    return await fetchCategoriesForAttractions(attractions);
  } catch (e) {
    console.error('Error fetching family friendly', e);
    return [];
  }
}

/**
 * Get all attraction categories with counts
 */
export async function getAllCategoriesWithCounts() {
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb.collection('attraction_categories').orderBy('name').get();
    const categories = snapshot.docs.map(doc => doc.data());

    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const countSnap = await adminDb!
          .collection('attractions')
          .where('active', '==', true)
          .where('attraction_category_ids', 'array-contains', cat.id)
          .count()
          .get();

        return {
          ...cat,
          attraction_count: countSnap.data().count
        };
      })
    );

    return categoriesWithCounts.filter(c => c.attraction_count > 0);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get districts with stats
 */
export async function getGovernoratesWithStats() {
  if (!adminDb) return [];
  const districts = goaDistricts;

  return await Promise.all(
    districts.map(async (dist) => {
      let count = 0;
      let totalRating = 0;
      let ratedCount = 0;

      const chunks = [];
      for (let i = 0; i < dist.areas.length; i += 10) {
        chunks.push(dist.areas.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const snapshot = await adminDb!
          .collection('attractions')
          .where('active', '==', true)
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
      }
      const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;
      return {
        id: dist.id,
        name: dist.name,
        slug: dist.slug,
        attraction_count: count,
        avg_rating: avgRating
      };
    })
  );
}

/**
 * Get attractions by category slug
 */
export async function getAttractionsByCategorySlug(categorySlug: string, limit?: number) {
  if (!adminDb) return [];

  try {
    const catSnap = await adminDb.collection('attraction_categories').where('slug', '==', categorySlug).limit(1).get();
    if (catSnap.empty) return [];
    const catId = catSnap.docs[0].data().id;

    let snapshot = await adminDb.collection('attractions')
      .where('active', '==', true)
      .where('attraction_category_ids', 'array-contains', catId)
      .get();

    let attractions = snapshot.docs.map(doc => doc.data());

    // In-memory sort
    attractions.sort((a, b) => (b.bok_score || 0) - (a.bok_score || 0));

    if (limit) attractions = attractions.slice(0, limit);

    return await fetchCategoriesForAttractions(attractions);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get attractions by governorate/district slug
 */
export async function getAttractionsByGovernorate(governorateSlug: string, limit?: number) {
  if (!adminDb) return [];

  const district = goaDistricts.find(d => d.slug === governorateSlug);
  // Backward compatibility for old Goa paths if they still come in (unlikely but safe)
  if (!district) return [];

  try {
    const chunks = [];
    for (let i = 0; i < district.areas.length; i += 10) {
      chunks.push(district.areas.slice(i, i + 10));
    }

    let allAttractions: any[] = [];
    for (const chunk of chunks) {
      let snapshot = await adminDb.collection('attractions')
        .where('active', '==', true)
        .where('area', 'in', chunk)
        .get();

      snapshot.forEach(doc => allAttractions.push(doc.data()));
    }

    allAttractions.sort((a, b) => (b.bok_score || 0) - (a.bok_score || 0));
    if (limit) allAttractions = allAttractions.slice(0, limit);

    return await fetchCategoriesForAttractions(allAttractions);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get total attraction count
 */
export async function getTotalAttractionCount() {
  if (!adminDb) return 0;
  const snap = await adminDb.collection('attractions').where('active', '==', true).count().get();
  return snap.data().count;
}

/**
 * Get all attractions for directory
 */
export async function getAllAttractions() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('attractions')
    .where('active', '==', true)
    .select('id', 'slug', 'name', 'area', 'bok_score', 'google_rating', 'attraction_category_ids')
    .get();

  const attractions = snap.docs.map(d => d.data());
  // In-memory sort by name
  attractions.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return attractions;
}

/**
 * Get attraction details by slug
 */
/**
 * Get attraction details by slug
 */
export async function getAttractionDetails(slug: string) {
  if (!adminDb) return null;
  // ... existing code ...
}

/**
 * Get nearby attractions (same area)
 */
export async function getNearbyAttractions(area: string, excludeId: string, limit: number = 4) {
  if (!adminDb || !area) return [];

  try {
    const snapshot = await adminDb
      .collection('attractions')
      .where('active', '==', true)
      .where('area', '==', area)
      .limit(limit + 1) // Fetch one extra to handle exclusion
      .get();

    const attractions = snapshot.docs
      .map(doc => doc.data())
      .filter(a => a.id !== excludeId)
      .slice(0, limit);

    // Sort by rating safely
    attractions.sort((a, b) => (b.bok_score || 0) - (a.bok_score || 0));

    return await fetchCategoriesForAttractions(attractions);
  } catch (error) {
    console.error(`Error fetching nearby attractions for area ${area}:`, error);
    return [];
  }
}
