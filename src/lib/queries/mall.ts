
/**
 * Mall Queries
 *
 * Centralized database queries for mall data with resolved relationships
 * Refactored for Firebase Firestore
 */

import { adminDb } from '@/lib/firebase/admin'

export interface MallWithRelations {
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
  snapchat?: string

  // Mall-Specific Basic Info
  total_stores?: number
  total_floors?: number
  total_parking_spaces?: number
  gross_leasable_area_sqm?: number
  year_opened?: number
  year_renovated?: number
  mall_type?: string // 'regional', 'super_regional', 'community', 'lifestyle', 'outlet'

  // Operating Hours
  weekday_open_time?: string
  weekday_close_time?: string
  weekend_open_time?: string
  weekend_close_time?: string
  friday_open_time?: string
  friday_close_time?: string
  ramadan_hours?: string
  public_holiday_hours?: string

  // Parking
  parking_type?: string // 'underground', 'multi_story', 'open_air', 'mixed'
  valet_parking?: boolean
  parking_fee?: string // 'free', 'paid', 'first_2_hours_free'
  ev_charging_stations?: number

  // Pricing/Retail Level
  retail_tier?: string // 'luxury', 'mid_range', 'budget', 'mixed'

  // Images
  hero_image?: string
  logo_image?: string

  // BOK Rating System
  bok_score?: number
  bok_score_breakdown?: {
    variety: number
    amenities: number
    accessibility: number
    cleanliness: number
    atmosphere: number
    value: number
  }
  bok_score_calculated_at?: string
  bok_score_version?: string

  // External Ratings
  google_rating?: number
  google_review_count?: number
  tripadvisor_rating?: number
  tripadvisor_review_count?: number
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

  // Awards & Special Features
  awards?: any
  special_features?: string[]

  // Array Relationships (IDs)
  mall_category_ids?: number[]
  mall_amenity_ids?: number[]
  mall_anchor_store_ids?: number[]

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
  amenities?: any[]
  categories?: any[]
  anchor_stores?: any[]
  stores?: any[]
  images?: any[]
  faqs?: any[]
  events?: any[]
}

// Helper for 'in' queries
async function fetchByIds(collection: string, ids: any[]) {
  if (!adminDb || !ids || ids.length === 0) return [];

  // Convert to strings to be safe if IDs are mixed types
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
 * Get mall by slug with all resolved relationships
 */
export async function getMallBySlug(slug: string): Promise<MallWithRelations | null> {
  if (!adminDb) return null

  try {
    const snap = await adminDb.collection('malls').where('slug', '==', slug).limit(1).get()

    if (snap.empty) {
      console.error('Mall not found due to empty snap', slug)
      return null
    }

    const mall = snap.docs[0].data() as MallWithRelations;

    // Get all relationships in parallel
    const fetchNeighborhood = async () => {
      if (!mall.neighborhood_id) return null;
      const s = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', mall.neighborhood_id).limit(1).get();
      return s.empty ? null : s.docs[0].data();
    };

    const fetchAmenities = async () => fetchByIds('mall_amenities', mall.mall_amenity_ids || []);
    const fetchCategories = async () => fetchByIds('mall_categories', mall.mall_category_ids || []);
    const fetchAnchorStores = async () => fetchByIds('mall_anchor_stores', mall.mall_anchor_store_ids || []);

    const fetchStores = async () => {
      const s = await adminDb!.collection('mall_stores')
        .where('mall_id', '==', mall.id)
        .where('is_open', '==', true)
        .orderBy('is_anchor', 'desc')
        .orderBy('name', 'asc') // Firestore limitation: needs composite index
        .get();
      return s.docs.map(d => d.data());
    };

    const fetchImages = async () => {
      const s = await adminDb!.collection('mall_images')
        .where('mall_id', '==', mall.id)
        .orderBy('is_hero', 'desc')
        .orderBy('display_order', 'asc')
        .get();
      return s.docs.map(d => d.data());
    };

    const fetchFaqs = async () => {
      const s = await adminDb!.collection('mall_faqs')
        .where('mall_id', '==', mall.id)
        .orderBy('display_order', 'asc')
        .get();
      return s.docs.map(d => d.data());
    };

    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const s = await adminDb!.collection('mall_events')
        .where('mall_id', '==', mall.id)
        .where('end_date', '>=', today)
        .orderBy('end_date', 'asc')
        .orderBy('start_date', 'asc')
        .limit(10)
        .get();
      return s.docs.map(d => d.data());
    };

    const [
      neighborhood, amenities, categories, anchorStores, stores, images, faqs, events
    ] = await Promise.all([
      fetchNeighborhood(),
      fetchAmenities(),
      fetchCategories(),
      fetchAnchorStores(),
      fetchStores().catch(e => { console.warn('Mall stores fetch', e); return []; }),
      fetchImages().catch(e => { console.warn('Mall images fetch', e); return []; }),
      fetchFaqs().catch(() => []),
      fetchEvents().catch(e => { console.warn('Mall events fetch', e); return []; })
    ]);

    return {
      ...mall,
      // @ts-ignore
      neighborhood: neighborhood || undefined,
      // @ts-ignore
      amenities,
      // @ts-ignore
      categories,
      // @ts-ignore
      anchor_stores: anchorStores,
      // @ts-ignore
      stores,
      // @ts-ignore
      images,
      // @ts-ignore
      faqs,
      // @ts-ignore
      events
    } as MallWithRelations

  } catch (error) {
    console.error('Error in getMallBySlug:', error)
    return null
  }
}

/**
 * Get mall with all resolved relationships by ID
 */
export async function getMallWithRelations(mallId: string): Promise<MallWithRelations | null> {
  if (!adminDb) return null
  // Reuse logic or copy paste for safety in this rough pass
  // I will copy paste logic for robustness
  try {
    const snap = await adminDb.collection('malls').where('id', '==', mallId).limit(1).get();
    if (snap.empty) return null;

    const mall = snap.docs[0].data() as MallWithRelations;

    // Simplified fetch for ID
    const fetchNeighborhood = async () => {
      if (!mall.neighborhood_id) return null;
      const s = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', mall.neighborhood_id).limit(1).get();
      return s.empty ? null : s.docs[0].data();
    };

    const fetchAmenities = async () => fetchByIds('mall_amenities', mall.mall_amenity_ids || []);
    const fetchCategories = async () => fetchByIds('mall_categories', mall.mall_category_ids || []);
    const fetchAnchorStores = async () => fetchByIds('mall_anchor_stores', mall.mall_anchor_store_ids || []);

    const fetchStores = async () => {
      const s = await adminDb!.collection('mall_stores').where('mall_id', '==', mall.id).orderBy('is_anchor', 'desc').get();
      return s.docs.map(d => d.data());
    };
    const fetchImages = async () => {
      const s = await adminDb!.collection('mall_images').where('mall_id', '==', mall.id).orderBy('is_hero', 'desc').get();
      return s.docs.map(d => d.data());
    };
    const fetchFaqs = async () => {
      const s = await adminDb!.collection('mall_faqs').where('mall_id', '==', mall.id).get();
      return s.docs.map(d => d.data());
    };
    const fetchEvents = async () => {
      const s = await adminDb!.collection('mall_events').where('mall_id', '==', mall.id).orderBy('start_date', 'asc').get();
      return s.docs.map(d => d.data());
    };

    const [neighborhood, amenities, categories, anchorStores, stores, images, faqs, events] =
      await Promise.all([
        fetchNeighborhood(), fetchAmenities(), fetchCategories(), fetchAnchorStores(),
        fetchStores().catch(() => []), fetchImages().catch(() => []), fetchFaqs().catch(() => []), fetchEvents().catch(() => [])
      ]);

    return {
      ...mall,
      // @ts-ignore
      neighborhood: neighborhood || undefined,
      // @ts-ignore
      amenities,
      // @ts-ignore
      categories,
      // @ts-ignore
      anchor_stores: anchorStores,
      // @ts-ignore
      stores,
      // @ts-ignore
      images,
      // @ts-ignore
      faqs,
      // @ts-ignore
      events
    } as MallWithRelations

  } catch (e) { console.error(e); return null; }
}

/**
 * Get all malls with basic info
 */
export async function getAllMalls(filters?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  if (!adminDb) return { malls: [], count: 0 }

  try {
    let query = adminDb.collection('malls').orderBy('created_at', 'desc');

    if (filters?.status && filters.status !== 'all') {
      query = query.where('extraction_status', '==', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snap = await query.get();
    return { malls: snap.docs.map(d => d.data()), count: snap.size };
  } catch (e) {
    console.error(e);
    return { malls: [], count: 0 }
  }
}

/**
 * Get malls by extraction status
 */
export async function getMallsByExtractionStatus(status: string) {
  if (!adminDb) return [];
  const snap = await adminDb.collection('malls').where('extraction_status', '==', status).orderBy('created_at', 'desc').get();
  return snap.docs.map(d => d.data());
}

/**
 * Get featured malls
 */
export async function getFeaturedMalls(limit: number = 6) {
  if (!adminDb) return [];
  try {
    const snap = await adminDb.collection('malls')
      .where('featured', '==', true)
      .where('active', '==', true)
      .orderBy('bok_score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Get malls by category
 */
export async function getMallsByCategory(categoryId: number, limit?: number) {
  if (!adminDb) return [];
  try {
    let query = adminDb.collection('malls')
      .where('active', '==', true)
      .where('mall_category_ids', 'array-contains', categoryId)
      .orderBy('bok_score', 'desc');
    if (limit) query = query.limit(limit);

    const snap = await query.get();
    return snap.docs.map(d => d.data());
  } catch (e) { console.error(e); return []; }
}

/**
 * Get mall categories with count
 */
export async function getMallCategoriesWithCount() {
  if (!adminDb) return [];
  try {
    const catSnap = await adminDb.collection('mall_categories').orderBy('display_order').get();
    const categories = catSnap.docs.map(d => d.data());

    return await Promise.all(categories.map(async (cat) => {
      const countSnap = await adminDb!.collection('malls')
        .where('active', '==', true)
        .where('mall_category_ids', 'array-contains', cat.id)
        .count().get();
      return { ...cat, mall_count: countSnap.data().count };
    }));
  } catch (e) { console.error(e); return []; }
}

/**
 * Get malls by category slug
 */
export async function getMallsByCategorySlug(categorySlug: string, limit?: number) {
  if (!adminDb) return { malls: [], categoryName: null };
  try {
    const catSnap = await adminDb.collection('mall_categories').where('slug', '==', categorySlug).limit(1).get();
    if (catSnap.empty) return { malls: [], categoryName: null };
    const cat = catSnap.docs[0].data();

    let query = adminDb.collection('malls')
      .where('active', '==', true)
      .where('mall_category_ids', 'array-contains', cat.id)
      .orderBy('bok_score', 'desc');
    if (limit) query = query.limit(limit);

    const snap = await query.get();
    return { malls: snap.docs.map(d => d.data()), categoryName: cat.name };
  } catch (e) { console.error(e); return { malls: [], categoryName: null }; }
}

/**
 * Get all malls for comprehensive directory listing
 */
export async function getAllMallsForListing() {
  if (!adminDb) return [];
  const snap = await adminDb.collection('malls')
    .where('active', '==', true)
    .orderBy('name', 'asc')
    .select('id', 'slug', 'name', 'area', 'bok_score', 'google_rating')
    .get();
  return snap.docs.map(d => d.data());
}
