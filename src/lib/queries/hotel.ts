
/**
 * Hotel Queries
 *
 * Centralized database queries for hotel data with resolved relationships
 * Refactored for Firebase Firestore
 */

import { adminDb } from '@/lib/firebase/admin'

export interface HotelWithRelations {
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

  // Hotel-Specific Basic Info
  star_rating?: number
  hotel_type?: string // 'hotel', 'resort', 'serviced_apartment', 'boutique', 'business', 'budget'
  total_rooms?: number
  total_floors?: number
  year_opened?: number
  year_renovated?: number

  // Operational
  check_in_time?: string
  check_out_time?: string
  check_in_age_minimum?: number
  pets_allowed?: boolean
  smoking_policy?: string // 'non_smoking', 'designated_areas', 'smoking_rooms_available'
  cancellation_policy?: string

  // Pricing
  price_range?: string // '$', '$$', '$$$', '$$$$'
  currency?: string
  average_nightly_rate?: number
  min_nightly_rate?: number
  max_nightly_rate?: number

  // Images
  hero_image?: string
  logo_image?: string
  thumbnail_url?: string

  // BOK Rating System
  bok_score?: number
  bok_score_breakdown?: {
    room_quality: number
    service: number
    cleanliness: number
    location: number
    value_for_money: number
    amenities: number
  }
  bok_score_calculated_at?: string
  bok_score_version?: string

  // External Ratings
  google_rating?: number
  google_review_count?: number
  tripadvisor_rating?: number
  tripadvisor_review_count?: number
  booking_com_rating?: number
  booking_com_review_count?: number
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

  // Awards & Certifications
  awards?: any // TripAdvisor Travelers' Choice, Forbes, etc.
  certifications?: string[] // 'green_certified', 'halal_friendly', 'family_friendly_certified'

  // Array Relationships (IDs)
  hotel_category_ids?: number[]
  hotel_amenity_ids?: number[]
  hotel_facility_ids?: number[]
  hotel_room_type_ids?: number[]

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
  features?: any[]
  facilities?: any[]
  room_types?: any[]
  images?: any[]
  faqs?: any[]
  policies?: any[]
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
 * Get hotel by slug with all resolved relationships
 */
export async function getHotelBySlug(slug: string): Promise<HotelWithRelations | null> {
  if (!adminDb) return null

  try {
    // Main hotel query
    const hotelSnap = await adminDb
      .collection('hotels')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (hotelSnap.empty) {
      console.error('Hotel not found for slug:', slug)
      return null
    }

    const hotel = hotelSnap.docs[0].data() as HotelWithRelations;

    // Parallel fetch relationships
    const fetchNeighborhood = async () => {
      if (!hotel.neighborhood_id) return null;
      const snap = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', hotel.neighborhood_id).limit(1).get();
      return snap.empty ? null : snap.docs[0].data();
    };

    const fetchAmenities = async () => fetchByIds('hotel_amenities', hotel.hotel_amenity_ids || []);
    const fetchCategories = async () => fetchByIds('hotel_categories', hotel.hotel_category_ids || []);
    const fetchFacilities = async () => fetchByIds('hotel_facilities', hotel.hotel_facility_ids || []);

    const fetchRoomTypes = async () => {
      const snap = await adminDb!.collection('hotel_rooms')
        .where('hotel_id', '==', hotel.id)
        .orderBy('display_order', 'asc')
        .get();
      return snap.docs.map(d => d.data());
    };

    const fetchImages = async () => {
      const snap = await adminDb!.collection('hotel_images')
        .where('hotel_id', '==', hotel.id)
        .orderBy('is_hero', 'desc')
        .orderBy('display_order', 'asc')
        .get();
      return snap.docs.map(d => d.data());
    };

    const fetchFaqs = async () => {
      const snap = await adminDb!.collection('hotel_faqs')
        .where('hotel_id', '==', hotel.id)
        .orderBy('display_order', 'asc')
        .get();
      return snap.docs.map(d => d.data());
    };

    const fetchPolicies = async () => {
      const snap = await adminDb!.collection('hotel_policies')
        .where('hotel_id', '==', hotel.id)
        .orderBy('display_order', 'asc')
        .get();
      return snap.docs.map(d => d.data());
    };

    const [
      neighborhood,
      amenities,
      categories,
      facilities,
      roomTypes,
      images,
      faqs,
      policies
    ] = await Promise.all([
      fetchNeighborhood(),
      fetchAmenities(),
      fetchCategories(),
      fetchFacilities(),
      fetchRoomTypes().catch(e => { console.warn('Room types fetch failed', e); return []; }),
      fetchImages().catch(e => { console.warn('Images fetch failed', e); return []; }),
      fetchFaqs().catch(e => { console.warn('Faqs fetch failed', e); return []; }),
      fetchPolicies().catch(e => { console.warn('Policies fetch failed', e); return []; })
    ]);

    return {
      ...hotel,
      // @ts-ignore
      neighborhood: neighborhood || undefined,
      // @ts-ignore
      amenities,
      // @ts-ignore
      categories,
      // @ts-ignore
      facilities,
      // @ts-ignore
      room_types: roomTypes,
      // @ts-ignore
      images,
      // @ts-ignore
      faqs,
      // @ts-ignore
      policies
    } as HotelWithRelations

  } catch (error) {
    console.error('Error in getHotelBySlug:', error)
    return null
  }
}

/**
 * Get hotel with all resolved relationships by ID
 */
export async function getHotelWithRelations(hotelId: string): Promise<HotelWithRelations | null> {
  if (!adminDb) return null

  try {
    const hotelSnap = await adminDb.collection('hotels').where('id', '==', hotelId).limit(1).get();
    if (hotelSnap.empty) return null;

    const hotel = hotelSnap.docs[0].data() as HotelWithRelations;

    // Reuse logic? Duplication for now to keep implementation simple and aligned with above pattern.
    // Ideally we extract a "hydrateHotel" function.

    const fetchNeighborhood = async () => {
      if (!hotel.neighborhood_id) return null;
      const snap = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', hotel.neighborhood_id).limit(1).get();
      return snap.empty ? null : snap.docs[0].data();
    };

    const fetchAmenities = async () => fetchByIds('hotel_amenities', hotel.hotel_amenity_ids || []);
    const fetchCategories = async () => fetchByIds('hotel_categories', hotel.hotel_category_ids || []);
    const fetchFacilities = async () => fetchByIds('hotel_facilities', hotel.hotel_facility_ids || []);

    const fetchRoomTypes = async () => {
      const snap = await adminDb!.collection('hotel_rooms').where('hotel_id', '==', hotel.id).orderBy('display_order', 'asc').get();
      return snap.docs.map(d => d.data());
    };
    const fetchImages = async () => {
      const snap = await adminDb!.collection('hotel_images').where('hotel_id', '==', hotel.id).orderBy('is_hero', 'desc').orderBy('display_order', 'asc').get();
      return snap.docs.map(d => d.data());
    };
    const fetchFaqs = async () => {
      const snap = await adminDb!.collection('hotel_faqs').where('hotel_id', '==', hotel.id).orderBy('display_order', 'asc').get();
      return snap.docs.map(d => d.data());
    };
    const fetchPolicies = async () => {
      const snap = await adminDb!.collection('hotel_policies').where('hotel_id', '==', hotel.id).orderBy('display_order', 'asc').get();
      return snap.docs.map(d => d.data());
    };

    const [neighborhood, amenities, categories, facilities, roomTypes, images, faqs, policies] = await Promise.all([
      fetchNeighborhood(),
      fetchAmenities(),
      fetchCategories(),
      fetchFacilities(),
      fetchRoomTypes().catch(() => []),
      fetchImages().catch(() => []),
      fetchFaqs().catch(() => []),
      fetchPolicies().catch(() => [])
    ]);

    return {
      ...hotel,
      // @ts-ignore
      neighborhood: neighborhood || undefined,
      // @ts-ignore
      amenities,
      // @ts-ignore
      categories,
      // @ts-ignore
      facilities,
      // @ts-ignore
      room_types: roomTypes,
      // @ts-ignore
      images,
      // @ts-ignore
      faqs,
      // @ts-ignore
      policies
    } as HotelWithRelations

  } catch (error) {
    console.error('Error in getHotelWithRelations:', error)
    return null
  }
}

/**
 * Get all hotels with basic info
 */
export async function getAllHotels(filters?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  if (!adminDb) return { hotels: [], count: 0 }

  try {
    let query = adminDb.collection('hotels').orderBy('created_at', 'desc');

    if (filters?.status && filters.status !== 'all') {
      query = query.where('status', '==', filters.status);
    }

    // Search is NOT supported natively in Firestore like 'ilike'.
    // We rely on simple prefix search or client-side filter (if small dataset), or an external index (Algolia/Typesense).
    // For migration, we simply IGNORE partial text search or implement strict prefix match if feasible.
    // Skipping search logic for now as Firestore doesn't support 'ilike'.

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    // Offset is not performant in Firestore but supported; however, SDK uses startAfter(doc).
    // Standard offset using integer skipping is not directly exposed in simple API easily without cursor.
    // We will skip offset implementation for this rough pass or fetch extra.

    const snap = await query.get();
    const hotels = snap.docs.map(d => d.data());

    return { hotels, count: snap.size }; // Count is of fetched, not total
  } catch (e) {
    console.error(e);
    return { hotels: [], count: 0 }
  }
}
