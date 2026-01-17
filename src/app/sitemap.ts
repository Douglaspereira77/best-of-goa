import type { MetadataRoute } from 'next'
import { adminDb } from '@/lib/firebase/admin'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bestgoa.com'

// Goa regions for location-based pages
const regions = [
  'north-goa',
  'south-goa',
  'panjim',
  'margao',
]

// Dish types for dish pages
const dishSlugs = [
  'sushi', 'burger', 'shawarma', 'biryani', 'pizza', 'pasta', 'steak', 'seafood',
  'falafel', 'hummus', 'kebab', 'ramen', 'curry', 'tacos', 'fried-chicken',
  'dessert', 'breakfast', 'salad', 'brunch'
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!adminDb) return [];

  // Fetch all data in parallel for efficiency
  const [
    restaurants,
    cuisines,
    hotels,
    attractions,
    attractionCategories,
    schools,
    malls,
    fitness,
  ] = await Promise.all([
    adminDb.collection('restaurants').where('active', '==', true).select('slug', 'updated_at').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('restaurants_cuisines').select('slug').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('hotels').where('active', '==', true).select('slug', 'updated_at').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('attractions').where('active', '==', true).select('slug', 'updated_at').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('attraction_categories').select('slug').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('schools').where('active', '==', true).select('slug', 'updated_at').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('malls').where('active', '==', true).select('slug', 'updated_at').get().then(s => s.docs.map(d => d.data())),
    adminDb.collection('fitness_places').where('active', '==', true).select('slug', 'updated_at').get().then(s => s.docs.map(d => d.data())),
  ]);

  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/application`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Hub pages
  const hubPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/places-to-eat`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/places-to-eat/dishes`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/places-to-stay`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/places-to-shop`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/places-to-visit`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/places-to-learn`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/things-to-do`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/things-to-do/fitness`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]

  // Dynamic pages mapping
  const cuisinePages: MetadataRoute.Sitemap = cuisines.map((c: any) => ({
    url: `${baseUrl}/places-to-eat/${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  const dishPages: MetadataRoute.Sitemap = dishSlugs.map((dish) => ({
    url: `${baseUrl}/places-to-eat/dishes/${dish}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const restaurantRegionPages: MetadataRoute.Sitemap = regions.map((region) => ({
    url: `${baseUrl}/places-to-eat/in/${region}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }))

  const restaurantPages: MetadataRoute.Sitemap = restaurants.map((r: any) => ({
    url: `${baseUrl}/places-to-eat/restaurants/${r.slug}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const hotelPages: MetadataRoute.Sitemap = hotels.map((h: any) => ({
    url: `${baseUrl}/places-to-stay/hotels/${h.slug}`,
    lastModified: h.updated_at ? new Date(h.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const attractionCategoryPathPages: MetadataRoute.Sitemap = [
    'museums', 'beaches', 'entertainment', 'parks', 'landmarks',
    'cultural', 'nature', 'historical', 'religious', 'shopping'
  ].map((slug) => ({
    url: `${baseUrl}/places-to-visit/category/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const attractionPages: MetadataRoute.Sitemap = attractions.map((a: any) => ({
    url: `${baseUrl}/places-to-visit/attractions/${a.slug}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const schoolPages: MetadataRoute.Sitemap = schools.map((s: any) => ({
    url: `${baseUrl}/places-to-learn/schools/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const mallPages: MetadataRoute.Sitemap = malls.map((m: any) => ({
    url: `${baseUrl}/places-to-shop/malls/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const fitnessPages: MetadataRoute.Sitemap = fitness.map((f: any) => ({
    url: `${baseUrl}/things-to-do/fitness/${f.slug}`,
    lastModified: f.updated_at ? new Date(f.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...hubPages,
    ...cuisinePages,
    ...dishPages,
    ...restaurantRegionPages,
    ...restaurantPages,
    ...hotelPages,
    ...attractionCategoryPathPages,
    ...attractionPages,
    ...schoolPages,
    ...mallPages,
    ...fitnessPages,
  ]
}

export const revalidate = 3600
export const dynamic = 'force-dynamic'
