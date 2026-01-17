
import { adminDb } from '@/lib/firebase/admin';

/**
 * Dish type definitions with keywords for searching
 */
export const dishTypes = {
  sushi: {
    name: 'Sushi',
    keywords: ['sushi', 'maki', 'nigiri', 'sashimi', 'roll'],
    description: 'Fresh Japanese sushi, maki rolls, and sashimi',
  },
  burger: {
    name: 'Burger',
    keywords: ['burger', 'cheeseburger', 'hamburger'],
    description: 'Gourmet burgers and classic American favorites',
  },
  shawarma: {
    name: 'Shawarma',
    keywords: ['shawarma', 'shawerma'],
    description: 'Traditional Middle Eastern shawarma wraps',
  },
  biryani: {
    name: 'Biryani',
    keywords: ['biryani', 'biriyani'],
    description: 'Authentic Indian biryani rice dishes',
  },
  pizza: {
    name: 'Pizza',
    keywords: ['pizza', 'pizzeria'],
    description: 'Italian pizzas and gourmet pies',
  },
  pasta: {
    name: 'Pasta',
    keywords: ['pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'carbonara', 'bolognese'],
    description: 'Italian pasta dishes and noodles',
  },
  steak: {
    name: 'Steak',
    keywords: ['steak', 'ribeye', 'sirloin', 'tenderloin', 'filet'],
    description: 'Premium steaks and grilled meats',
  },
  seafood: {
    name: 'Seafood',
    keywords: ['seafood', 'fish', 'shrimp', 'lobster', 'salmon', 'prawns'],
    description: 'Fresh seafood and fish dishes',
  },
  falafel: {
    name: 'Falafel',
    keywords: ['falafel'],
    description: 'Middle Eastern falafel wraps and plates',
  },
  hummus: {
    name: 'Hummus',
    keywords: ['hummus', 'humus'],
    description: 'Traditional hummus and mezze',
  },
  kebab: {
    name: 'Kebab',
    keywords: ['kebab', 'kabab', 'kebob', 'shish'],
    description: 'Grilled kebabs and skewered meats',
  },
  ramen: {
    name: 'Ramen',
    keywords: ['ramen', 'noodle soup'],
    description: 'Japanese ramen noodle soups',
  },
  curry: {
    name: 'Curry',
    keywords: ['curry', 'masala', 'tikka'],
    description: 'Indian curries and masala dishes',
  },
  tacos: {
    name: 'Tacos',
    keywords: ['taco', 'tacos', 'burrito', 'quesadilla'],
    description: 'Mexican tacos and street food',
  },
  'fried-chicken': {
    name: 'Fried Chicken',
    keywords: ['fried chicken', 'crispy chicken', 'chicken wings'],
    description: 'Crispy fried chicken and wings',
  },
  dessert: {
    name: 'Dessert',
    keywords: ['dessert', 'cake', 'ice cream', 'chocolate', 'cheesecake', 'kunafa'],
    description: 'Sweet desserts and pastries',
  },
  breakfast: {
    name: 'Breakfast',
    keywords: ['breakfast', 'eggs', 'pancake', 'waffle', 'omelette'],
    description: 'Breakfast favorites and morning meals',
  },
  salad: {
    name: 'Salad',
    keywords: ['salad', 'caesar', 'fattoush', 'greek salad'],
    description: 'Fresh salads and healthy options',
  },
  brunch: {
    name: 'Brunch',
    keywords: ['brunch', 'eggs benedict', 'french toast', 'avocado toast', 'mimosa'],
    description: 'Weekend brunch spots with all-day breakfast favorites',
  },
}

export type DishType = keyof typeof dishTypes

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
 * Get all restaurants that serve a specific dish type
 */
export async function getRestaurantsByDish(dishSlug: string, limit?: number) {
  if (!adminDb) return null;

  const dishType = dishTypes[dishSlug as DishType]
  if (!dishType) return null;

  // WARNING: Firestore does not support ILIKE or text search natively.
  // The original implementation used 'ilike' on 'restaurants_dishes' table.
  // We cannot replicate this without a search service (Algolia/Typesense).
  //
  // TEMPORARY FALLBACK: Return empty list or basic fallback
  console.warn('getRestaurantsByDish: Full text search not supported in Firestore migration. Returning empty list.');

  return {
    dish: dishType,
    restaurants: [],
    totalCount: 0,
  }

  /* 
  // Code for when a search solution is implemented:
  try {
     // Fetch logic here
  } catch(e) { ... }
  */
}

/**
 * Get popular dishes with restaurant counts
 */
export async function getPopularDishesWithCounts() {
  if (!adminDb) return [];

  // Similar issue: cannot count based on ILIKE.
  // Returning 0 counts implies feature unavailable.

  const dishCounts = Object.entries(dishTypes).map(([slug, dishType]) => {
    return {
      slug,
      name: dishType.name,
      description: dishType.description,
      count: 0, // Placeholder
    }
  });

  return dishCounts;
}

/**
 * Get featured dishes for homepage/hub pages
 */
export async function getFeaturedDishes(limit: number = 8) {
  const allDishes = await getPopularDishesWithCounts()
  return allDishes.slice(0, limit)
}

/**
 * Get dish metadata by slug
 */
export function getDishBySlug(slug: string) {
  return dishTypes[slug as DishType] || null
}

/**
 * Get all available dish slugs for static generation
 */
export function getAllDishSlugs() {
  return Object.keys(dishTypes)
}
