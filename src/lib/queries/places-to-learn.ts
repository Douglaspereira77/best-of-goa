
/**
 * Places to Learn (Schools) - Database Query Functions
 *
 * All database queries for the schools directory
 * Refactored for Firebase Firestore && Goa Locations
 */

import { adminDb } from '@/lib/firebase/admin';
import { GOA_DISTRICTS } from '@/lib/utils/goa-locations';


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
 * Get top rated schools for featured section
 */
export async function getTopRatedSchools(limit: number = 8) {
  if (!adminDb) return [];

  // Goal: bok_score >= 7.0
  try {
    const snap = await adminDb.collection('schools')
      .where('active', '==', true)
      .where('bok_score', '>=', 7.0)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();

    let schools = snap.docs.map(d => d.data());

    // If not enough, fetch additional logic? 
    // Simplified for migration: Just return what we found or fallback to active sorted by created_at
    if (schools.length < limit) {
      const moreSnap = await adminDb.collection('schools')
        .where('active', '==', true)
        .orderBy('created_at', 'desc')
        .limit(limit - schools.length)
        .get();
      // Filter dupes
      const existingIds = new Set(schools.map((s: any) => s.id));
      moreSnap.forEach(d => {
        if (!existingIds.has(d.data().id)) schools.push(d.data());
      });
    }

    // Populate categories
    const schoolsWithCats = await Promise.all(schools.map(async (s: any) => {
      const categories = await fetchByIds('school_categories', s.school_category_ids || []);
      return { ...s, categories };
    }));
    return schoolsWithCats;

  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Get international schools
 */
export async function getInternationalSchools(limit: number = 8) {
  if (!adminDb) return [];
  try {
    // Firestore 'in' query for OR on single field
    const snap = await adminDb.collection('schools')
      .where('active', '==', true)
      .where('school_type', 'in', ['international', 'bilingual'])
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();

    const schools = snap.docs.map(d => d.data());
    const schoolsWithCats = await Promise.all(schools.map(async (s: any) => {
      const categories = await fetchByIds('school_categories', s.school_category_ids || []);
      return { ...s, categories };
    }));
    return schoolsWithCats;
  } catch (e) { console.error(e); return []; }
}

/**
 * Get schools by curriculum type
 */
export async function getSchoolsByCurriculum(curriculum: string, limit: number = 12) {
  if (!adminDb) return [];
  try {
    let query = adminDb.collection('schools').where('active', '==', true);

    if (curriculum === 'international') {
      query = query.where('school_type', 'in', ['international', 'bilingual']);
    } else {
      query = query.where('curriculum', 'array-contains', curriculum);
    }

    const snap = await query.orderBy('bok_score', 'desc').limit(limit).get();
    const schools = snap.docs.map(d => d.data());
    const schoolsWithCats = await Promise.all(schools.map(async (s: any) => {
      const categories = await fetchByIds('school_categories', s.school_category_ids || []);
      return { ...s, categories };
    }));
    return schoolsWithCats;
  } catch (e) { console.error(e); return []; }
}

/**
 * Get all school categories with counts
 */
export async function getAllCategoriesWithCounts() {
  if (!adminDb) return [];
  try {
    const catSnap = await adminDb.collection('school_categories').orderBy('display_order', 'asc').get();
    const categories = catSnap.docs.map(d => d.data());

    const results = await Promise.all(categories.map(async (cat: any) => {
      const countSnap = await adminDb!.collection('schools')
        .where('active', '==', true)
        .where('school_category_ids', 'array-contains', cat.id)
        .count().get();
      return { ...cat, school_count: countSnap.data().count };
    }));
    return results.filter(c => c.school_count > 0);
  } catch (e) { console.error(e); return []; }
}

/**
 * Get Goa districts with school counts and stats
 */
export async function getGovernoratesWithStats() {
  if (!adminDb) return [];

  // Goa Districts
  const districts = GOA_DISTRICTS || [
    { id: 'north-goa', name: 'North Goa', slug: 'north-goa', areas: ['Panjim', 'Mapusa'] },
    { id: 'south-goa', name: 'South Goa', slug: 'south-goa', areas: ['Margao', 'Vasco'] }
  ];

  return await Promise.all(districts.map(async (dist) => {
    let count = 0;
    let totalRating = 0;
    let ratedCount = 0;

    // Chunk areas
    const chunks = [];
    for (let i = 0; i < dist.areas.length; i += 10) {
      chunks.push(dist.areas.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snap = await adminDb!.collection('schools')
        .where('active', '==', true)
        .where('area', 'in', chunk)
        .select('google_rating')
        .get();
      count += snap.size;
      snap.forEach(d => {
        const r = d.data().google_rating;
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
      school_count: count,
      avg_rating: avgRating
    };
  }));
}

/**
 * Get schools by grade level
 */
export async function getSchoolsByGradeLevel(gradeLevel: string, limit: number = 12) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('schools')
      .where('active', '==', true)
      .where('grade_levels', 'array-contains', gradeLevel)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Get schools by category (for category pages)
 */
export async function getSchoolsByCategory(categorySlug: string, limit: number = 20) {
  if (!adminDb) return [];
  try {
    const catSnap = await adminDb.collection('school_categories').where('slug', '==', categorySlug).limit(1).get();
    if (catSnap.empty) return [];
    const category = catSnap.docs[0].data();

    const snap = await adminDb.collection('schools')
      .where('active', '==', true)
      .where('school_category_ids', 'array-contains', category.id)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();

    const schools = snap.docs.map(d => d.data());
    const schoolsWithCats = await Promise.all(schools.map(async (s: any) => {
      const categories = await fetchByIds('school_categories', s.school_category_ids || []);
      return { ...s, categories };
    }));
    return schoolsWithCats;
  } catch (e) { console.error(e); return []; }
}

/**
 * Get individual school by slug
 */
export async function getSchoolBySlug(slug: string) {
  if (!adminDb) return null;
  try {
    const snap = await adminDb.collection('schools').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return null;
    const school = snap.docs[0].data();

    // Populate
    const categories = await fetchByIds('school_categories', school.school_category_ids || []);
    const features = await fetchByIds('school_features', school.school_feature_ids || []);

    return {
      ...school,
      categories,
      features
    };
  } catch (e) { console.error(e); return null; }
}

/**
 * Get total school count
 */
export async function getTotalSchoolCount() {
  if (!adminDb) return 0;
  const snap = await adminDb.collection('schools').where('active', '==', true).count().get();
  return snap.data().count;
}

/**
 * Get STEM-focused schools
 */
export async function getSTEMSchools(limit: number = 4) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('schools')
      .where('active', '==', true)
      .where('special_programs', 'array-contains', 'stem')
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Search schools by query
 */
export async function searchSchools(query: string, filters: any = {}, limit: number = 20) {
  if (!adminDb) return [];
  console.warn('Full text search disabled in migration. Returning basic list.');
  return [];
}

/**
 * Get ALL schools (for comprehensive internal linking / SEO)
 */
export async function getAllSchools() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('schools')
    .where('active', '==', true)
    .orderBy('name', 'asc')
    .select('id', 'slug', 'name', 'area', 'bok_score', 'google_rating', 'curriculum')
    .get();
  return snap.docs.map(d => d.data());
}
