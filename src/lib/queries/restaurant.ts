import { adminDb } from '@/lib/firebase/admin';
import { RestaurantData } from '@/lib/schema/types';
import { logDebug } from '../debug-logger';

// Helper to handle Firestore 'in' query limit of 10
async function fetchByIdsAsString(collectionName: string, ids: string[] | number[]) {
  if (!ids || ids.length === 0) return [];
  if (!adminDb) return [];

  // Convert IDs to strings for robust comparison if Firestore IDs are strings
  // Assuming the collections use the same IDs (which might be integers in Postgres, but strings in Firestore)
  // For safety, we query assuming the field 'id' exists on the document.

  const chunks = [];
  const chunkSize = 10;
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results: any[] = [];
  for (const chunk of chunks) {
    const snapshot = await adminDb
      .collection(collectionName)
      .where('id', 'in', chunk)
      .get();

    snapshot.forEach(doc => results.push(doc.data()));
  }
  return results;
}

export interface RestaurantWithRelations extends RestaurantData {
  cuisines?: any[];
  categories?: any[];
  features?: any[];
  meals?: any[];
  good_for?: any[];
  neighborhood?: any;
  dishes?: any[];
  faqs?: any[];
  images?: any[];
  reviews?: any[];
}

/**
 * Get restaurant by slug with all related data
 */
export async function getRestaurantBySlug(
  slug: string
): Promise<RestaurantWithRelations | null> {
  console.log('[Restaurant Query] Looking for slug:', slug);

  if (!adminDb) {
    console.error('[Restaurant Query] Firebase Admin not initialized');
    return null;
  }

  try {
    // 1. Fetch restaurant basic data
    const snapshot = await adminDb
      .collection('restaurants')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      logDebug(`[Restaurant Query] Restaurant not found for slug: ${slug}`);
      return null;
    }

    const restaurantDoc = snapshot.docs[0];
    const restaurant = { id: restaurantDoc.id, ...restaurantDoc.data() } as RestaurantData;

    console.log('[Restaurant Query] Restaurant found:', restaurant.name);

    // 2. Parallel Fetching of Relations
    // We assume the collections are named similar to the tables but simpler: 'cuisines', 'categories', etc.
    // Or we stick to the Supabase table names for easier migration: 'restaurants_cuisines', etc.
    // Let's use the table names as collection names to minimize data mapping friction for now.

    // Arrays for parallel promises
    const promises: Promise<any>[] = [];

    // Cuisines
    const cuisineIds = restaurant.restaurant_cuisine_ids;
    const fetchCuisines = fetchByIdsAsString('restaurants_cuisines', cuisineIds || []);

    // Categories
    const categoryIds = restaurant.restaurant_category_ids;
    const fetchCategories = fetchByIdsAsString('restaurants_categories', categoryIds || []);

    // Features
    const featureIds = restaurant.restaurant_feature_ids;
    const fetchFeatures = fetchByIdsAsString('restaurants_features', featureIds || []);

    // Meals
    const mealIds = restaurant.restaurant_meal_ids;
    const fetchMeals = fetchByIdsAsString('restaurants_meals', mealIds || []);

    // Good For
    const goodForIds = restaurant.restaurant_good_for_ids;
    const fetchGoodFor = fetchByIdsAsString('restaurants_good_for', goodForIds || []);

    // Neighborhood
    const fetchNeighborhood = async () => {
      if (!restaurant.neighborhood_id) return null;
      const ns = await adminDb!.collection('restaurant_neighborhoods').where('id', '==', restaurant.neighborhood_id).limit(1).get();
      return ns.empty ? null : ns.docs[0].data();
    };

    // Dishes (Related by restaurant_id)
    const fetchDishes = async () => {
      if (!restaurant.id) return [];

      const ds = await adminDb!
        .collection('restaurants_dishes')
        .where('restaurant_id', '==', restaurant.id)
        .limit(20) // Increased limit since we sort in memory
        .get();

      const dishes: any[] = [];
      ds.forEach(d => dishes.push(d.data()));

      // Sort in memory
      // @ts-ignore
      return dishes.sort((a, b) => (b.mentions_count || 0) - (a.mentions_count || 0)).slice(0, 10);
    };

    // FAQs
    const fetchFaqs = async () => {
      if (!restaurant.id) return [];
      const fs = await adminDb!
        .collection('restaurants_faqs')
        .where('restaurant_id', '==', restaurant.id)
        .get();

      const faqs: any[] = [];
      fs.forEach(f => faqs.push(f.data()));

      // Sort in memory
      // @ts-ignore
      return faqs.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    };

    // Images - Use the images array from the restaurant document itself
    const fetchImages = async () => {
      // Images are stored as an array on the restaurant document
      // @ts-ignore
      return restaurant.images || [];
    };

    const [
      cuisines,
      categories,
      features,
      meals,
      good_for,
      neighborhood,
      dishes,
      faqs,
      images
    ] = await Promise.all([
      fetchCuisines,
      fetchCategories,
      fetchFeatures,
      fetchMeals,
      fetchGoodFor,
      fetchNeighborhood(),
      fetchDishes().catch(e => { console.warn('Dishes fetch failed (index missing?)', e); return []; }),
      fetchFaqs().catch(e => { console.warn('FAQs fetch failed', e); return []; }),
      fetchImages()
    ]);

    // Image Fallback Logic
    let finalImages = images;
    let heroImage = restaurant.hero_image;

    // @ts-ignore
    if ((!finalImages || finalImages.length === 0) && restaurant.photos && Array.isArray(restaurant.photos)) {
      // @ts-ignore
      finalImages = restaurant.photos.map((photo: any, index: number) => ({
        id: `photo-${index}`,
        url: photo.url,
        alt_text: photo.alt || photo.description,
        is_hero: photo.primary === true,
        type: 'photo',
      }));

      // @ts-ignore
      if (!heroImage && restaurant.photos.length > 0) {
        // @ts-ignore
        const primaryPhoto = restaurant.photos.find((p: any) => p.primary === true);
        // @ts-ignore
        heroImage = primaryPhoto ? primaryPhoto.url : restaurant.photos[0].url;
      }
    }

    // Parse reviews from Apify output
    let reviews: any[] = [];
    // @ts-ignore
    if (restaurant.apify_output && restaurant.apify_output.reviews) {
      // @ts-ignore
      reviews = restaurant.apify_output.reviews
        .filter((r: any) => r.text && r.text.trim().length > 0)
        .slice(0, 10)
        .map((r: any) => ({
          author_name: r.authorTitle || r.name || 'Anonymous',
          author: r.authorTitle || r.name || 'Anonymous',
          date: r.publishedAtDate || r.publishAt || new Date().toISOString().split('T')[0],
          relative_time_description: r.publishedAtDate || '',
          text: r.text || '',
          rating: r.stars || 5,
        }));
    }

    return {
      ...restaurant,
      hero_image: heroImage,
      cuisines,
      categories,
      features,
      meals,
      good_for,
      neighborhood,
      dishes,
      faqs: (faqs && faqs.length > 0) ? faqs : (restaurant.faqs || []),
      images: finalImages,
      reviews,
    };

  } catch (error) {
    logDebug(`[Restaurant Query] Fatal Error for slug ${slug}: ${error}`);
    return null;
  }
}

/**
 * Get all restaurant slugs for static generation
 */
export async function getAllRestaurantSlugs(): Promise<string[]> {
  if (!adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection('restaurants')
      .where('active', '==', true)
      .select('slug') // Firestore projection
      .get();

    return snapshot.docs.map(doc => doc.data().slug);
  } catch (error) {
    console.error('Error fetching restaurant slugs:', error);
    return [];
  }
}
