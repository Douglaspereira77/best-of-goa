
/**
 * Fitness Queries
 *
 * Centralized database queries for fitness center data with resolved relationships
 * Refactored for Firebase Firestore
 */

import { adminDb } from '@/lib/firebase/admin'

export interface FitnessPlaceWithRelations {
  id: string
  name: string
  name_ar?: string
  google_place_id?: string
  slug?: string
  address?: string
  area?: string
  country_code?: string
  latitude?: number
  longitude?: number
  neighborhood_id?: number
  neighborhood?: { id: number; name: string; slug: string; governorate_id: number }

  // Contact Information
  phone?: string
  email?: string
  website?: string
  whatsapp?: string

  // Social media
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
  snapchat?: string

  // Fitness-Specific Basic Info
  fitness_types?: string[] // ['gym', 'yoga', 'crossfit', etc.]
  gender_policy?: string // 'co-ed', 'women-only', 'men-only', 'separate-hours'
  amenities?: Record<string, any> // {pool: true, sauna: true, parking: 'free', etc.}

  // Pricing (Optional - Manual Entry)
  pricing_summary?: string
  membership_types?: any

  // Classes & Trainers (Optional)
  class_schedule?: any
  trainer_certifications?: string[]
  group_classes_available?: boolean
  personal_training_available?: boolean

  // Operational
  opening_hours?: any
  open_24_hours?: boolean
  trial_session_available?: boolean
  day_pass_available?: boolean

  // Visitor Information
  age_restrictions?: string
  minimum_age?: number
  locker_rooms?: boolean
  showers?: boolean
  towel_service?: boolean
  equipment_rental?: boolean
  juice_bar?: boolean

  // Accessibility & Parking
  wheelchair_accessible?: boolean
  accessibility_info?: string
  parking_available?: boolean
  parking_info?: string

  // Images
  hero_image?: string
  logo_image?: string

  // BOK Rating System
  bok_score?: number
  bok_score_breakdown?: {
    facilities: number
    equipment: number
    cleanliness: number
    staff: number
    value_for_money: number
    atmosphere: number
  }
  bok_score_calculated_at?: string
  bok_score_version?: string

  // External Ratings
  google_rating?: number
  google_review_count?: number
  facebook_rating?: number
  facebook_review_count?: number
  total_reviews_aggregated?: number

  // AI-generated content
  description?: string
  description_ar?: string
  short_description?: string
  review_sentiment?: string
  review_sentiment_updated_at?: string

  // SEO
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  og_title?: string
  og_description?: string
  og_image?: string

  // Additional Context
  year_established?: number
  awards?: string[]
  specialties?: string[]
  fun_facts?: any

  // Array Relationships (IDs)
  fitness_category_ids?: number[]
  fitness_amenity_ids?: number[]
  fitness_feature_ids?: number[]

  // Extraction Workflow
  extraction_status?: string
  extraction_progress?: any
  apify_output?: any
  firecrawl_output?: any
  extraction_source?: string
  extraction_job_id?: string

  // Status
  verified?: boolean
  featured?: boolean
  active?: boolean

  // Timestamps
  created_at?: string
  updated_at?: string
  last_scraped_at?: string

  // Relationships (resolved)
  categories?: any[]
  amenitiesResolved?: any[]
  features?: any[]
  images?: any[]
  faqs?: any[]
}

// Helper for 'in' queries
async function fetchByIds(collection: string, ids: any[]) {
  if (!adminDb || !ids || ids.length === 0) return [];

  // Convert to strings
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
 * Get fitness place by slug with all resolved relationships
 */
export async function getFitnessPlaceBySlug(slug: string, isPreview: boolean = false): Promise<FitnessPlaceWithRelations | null> {
  if (!adminDb) return null

  try {
    let query = adminDb.collection('fitness_places').where('slug', '==', slug)

    if (!isPreview) {
      query = query.where('active', '==', true);
    }

    const snap = await query.limit(1).get();

    if (snap.empty) {
      console.error('Fitness place not found for slug:', slug)
      return null
    }

    const fitnessPlace = snap.docs[0].data() as FitnessPlaceWithRelations;

    // Get relationships in parallel
    const fetchNeighborhood = async () => {
      if (!fitnessPlace.neighborhood_id) return null;
      const s = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', fitnessPlace.neighborhood_id).limit(1).get();
      return s.empty ? null : s.docs[0].data();
    };

    const fetchCategories = async () => fetchByIds('fitness_categories', fitnessPlace.fitness_category_ids || []);
    const fetchAmenities = async () => fetchByIds('fitness_amenities', fitnessPlace.fitness_amenity_ids || []);
    const fetchFeatures = async () => fetchByIds('fitness_features', fitnessPlace.fitness_feature_ids || []);

    const fetchImages = async () => {
      const s = await adminDb!.collection('fitness_images')
        .where('fitness_place_id', '==', fitnessPlace.id)
        .orderBy('is_hero', 'desc')
        .orderBy('display_order', 'asc')
        .get();
      return s.docs.map(d => d.data());
    };

    const fetchFaqs = async () => {
      const s = await adminDb!.collection('fitness_faqs')
        .where('fitness_place_id', '==', fitnessPlace.id)
        .where('verified', '==', true)
        .orderBy('is_featured', 'desc')
        .orderBy('display_order', 'asc')
        .get();
      return s.docs.map(d => d.data());
    };

    const [
      neighborhood, categories, amenitiesResolved, features, images, faqs
    ] = await Promise.all([
      fetchNeighborhood(),
      fetchCategories(),
      fetchAmenities(),
      fetchFeatures(),
      fetchImages().catch(() => []),
      fetchFaqs().catch(() => [])
    ]);

    return {
      ...fitnessPlace,
      // @ts-ignore
      neighborhood: neighborhood || undefined,
      // @ts-ignore
      categories,
      // @ts-ignore
      amenitiesResolved,
      // @ts-ignore
      features,
      // @ts-ignore
      images,
      // @ts-ignore
      faqs
    } as FitnessPlaceWithRelations

  } catch (error) {
    console.error('Error in getFitnessPlaceBySlug:', error)
    return null
  }
}

/**
 * Get all active fitness places with basic info
 */
export async function getAllFitnessPlaces(options?: {
  limit?: number
  offset?: number
  fitnessTypes?: string[]
  genderPolicy?: string
  hasPool?: boolean
  hasSauna?: boolean
  hasParking?: boolean
  area?: string
  featured?: boolean
}): Promise<FitnessPlaceWithRelations[]> {
  if (!adminDb) return []

  try {
    let query = adminDb.collection('fitness_places').where('active', '==', true)

    // Apply filters
    // Note: Firestore overlaps/array-contains-any check
    if (options?.fitnessTypes && options.fitnessTypes.length > 0) {
      query = query.where('fitness_types', 'array-contains-any', options.fitnessTypes);
      // Warning: Can only have one array-contains clause usually.
    }

    if (options?.genderPolicy) {
      query = query.where('gender_policy', '==', options.genderPolicy)
    }

    if (options?.area) {
      query = query.where('area', '==', options.area)
    }

    if (options?.featured !== undefined) {
      query = query.where('featured', '==', options.featured)
    }

    // Amenities filters (check JSONB -> Map)
    // Firestore allows dot notation for map fields: 'amenities.pool' == true
    if (options?.hasPool) {
      query = query.where('amenities.pool', '==', true)
    }

    if (options?.hasSauna) {
      query = query.where('amenities.sauna', '==', true)
    }

    // Ordering
    // Firestore requires indexes for mixed ordering.
    // We will apply limit and basic ordering
    // query = query.orderBy('featured', 'desc').orderBy('bok_score', 'desc');
    // For now simple:

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const snap = await query.get();
    return snap.docs.map(d => d.data() as FitnessPlaceWithRelations);

  } catch (error) {
    console.error('Error in getAllFitnessPlaces:', error)
    return []
  }
}

/**
 * Get fitness place by ID (for admin)
 */
export async function getFitnessPlaceById(id: string): Promise<FitnessPlaceWithRelations | null> {
  if (!adminDb) return null
  try {
    const snap = await adminDb.collection('fitness_places').where('id', '==', id).limit(1).get();
    if (snap.empty) return null;

    const data = snap.docs[0].data() as FitnessPlaceWithRelations;

    const fetchNeighborhood = async () => {
      if (!data.neighborhood_id) return null;
      const s = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', data.neighborhood_id).limit(1).get();
      return s.empty ? null : s.docs[0].data();
    };

    const fetchCategories = async () => fetchByIds('fitness_categories', data.fitness_category_ids || []);
    const fetchAmenities = async () => fetchByIds('fitness_amenities', data.fitness_amenity_ids || []);
    const fetchFeatures = async () => fetchByIds('fitness_features', data.fitness_feature_ids || []);

    const fetchImages = async () => {
      const s = await adminDb!.collection('fitness_images').where('fitness_place_id', '==', data.id).orderBy('is_hero', 'desc').get();
      return s.docs.map(d => d.data());
    };

    const fetchFaqs = async () => {
      const s = await adminDb!.collection('fitness_faqs').where('fitness_place_id', '==', data.id).get();
      return s.docs.map(d => d.data());
    };

    const [neighborhood, categories, amenitiesResolved, features, images, faqs] = await Promise.all([
      fetchNeighborhood(), fetchCategories(), fetchAmenities(), fetchFeatures(),
      fetchImages().catch(() => []), fetchFaqs().catch(() => [])
    ]);

    return {
      ...data,
      // @ts-ignore
      neighborhood: neighborhood || undefined,
      // @ts-ignore
      categories,
      // @ts-ignore
      amenitiesResolved,
      // @ts-ignore
      features,
      // @ts-ignore
      images,
      // @ts-ignore
      faqs
    } as FitnessPlaceWithRelations;

  } catch (error) {
    console.error('Error in getFitnessPlaceById:', error)
    return null
  }
}

/**
 * Get extraction queue
 */
export async function getFitnessExtractionQueue(): Promise<FitnessPlaceWithRelations[]> {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('fitness_places')
      .where('extraction_status', 'in', ['pending', 'processing'])
      .orderBy('created_at', 'desc')
      .get();
    return snap.docs.map(d => d.data() as FitnessPlaceWithRelations);
  } catch (e) { console.error(e); return []; }
}

/**
 * Update fitness place
 */
export async function updateFitnessPlace(
  id: string,
  updates: Partial<FitnessPlaceWithRelations>
): Promise<boolean> {
  if (!adminDb) return false;
  try {
    await adminDb.collection('fitness_places').doc(id).update({
      ...updates,
      updated_at: new Date().toISOString()
    });
    return true;
  } catch (e) { console.error(e); return false; }
}

/**
 * Create new fitness place
 */
export async function createFitnessPlace(
  data: Partial<FitnessPlaceWithRelations>
): Promise<string | null> {
  if (!adminDb) return null;
  try {
    // Warning: This insert expects us to generate an ID or use doc().id
    // The original code used supbase insert().select('id').
    // We will make a new doc ref
    const docRef = adminDb.collection('fitness_places').doc();
    await docRef.set({ ...data, id: docRef.id }); // Ensure ID is in the doc
    return docRef.id;
  } catch (e) { console.error(e); return null; }
}

/**
 * Delete fitness place
 */
export async function deleteFitnessPlace(id: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    await adminDb.collection('fitness_places').doc(id).delete();
    return true;
  } catch (e) { console.error(e); return false; }
}

/**
 * Get all fitness categories
 */
export async function getFitnessCategories() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('fitness_categories').orderBy('display_order').get();
  return snap.docs.map(d => d.data());
}

/**
 * Get all fitness amenities
 */
export async function getFitnessAmenities() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('fitness_amenities').orderBy('category').orderBy('display_order').get();
  return snap.docs.map(d => d.data());
}

/**
 * Get all fitness features
 */
export async function getFitnessFeatures() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('fitness_features').orderBy('category').orderBy('display_order').get();
  return snap.docs.map(d => d.data());
}