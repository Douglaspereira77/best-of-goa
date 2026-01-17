
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables from .env.local BEFORE imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');

dotenv.config({ path: envPath });

async function main() {
    // Dynamic import to ensure env vars are loaded first
    const { adminDb } = await import('../lib/firebase/admin');

    if (!adminDb) {
        console.error('ERROR: Firebase Admin failed to initialize. Check FIREBASE_SERVICE_ACCOUNT_KEY in .env.local');
        process.exit(1);
    }

    const db = adminDb;

    // --- DATA DEFINITIONS ---

    const CUISINES = [
        { name: 'Goan', slug: 'goan', icon: '🍛' },
        { name: 'Seafood', slug: 'seafood', icon: '🦐' },
        { name: 'Indian', slug: 'indian', icon: '🥘' },
        { name: 'Continental', slug: 'continental', icon: '🥪' },
        { name: 'Italian', slug: 'italian', icon: '🍝' },
        { name: 'Chinese', slug: 'chinese', icon: '🥢' },
        { name: 'Pan Asian', slug: 'pan-asian', icon: '🍜' },
        { name: 'Portuguese', slug: 'portuguese', icon: '🍗' },
        { name: 'Fusion', slug: 'fusion', icon: '🥗' },
        { name: 'Cafe', slug: 'cafe', icon: '☕' },
        { name: 'Bakery', slug: 'bakery', icon: '🥐' },
        { name: 'Bar & Pub', slug: 'bar-pub', icon: '🍺' },
        { name: 'Vegetarian', slug: 'vegetarian', icon: '🥦' },
        { name: 'Vegan', slug: 'vegan', icon: '🥑' },
        { name: 'Fast Food', slug: 'fast-food', icon: '🍔' },
        { name: 'Pizza', slug: 'pizza', icon: '🍕' },
        { name: 'Steakhouse', slug: 'steakhouse', icon: '🥩' },
        { name: 'Desserts', slug: 'desserts', icon: '🍰' },
        { name: 'Healthy', slug: 'healthy', icon: '🥗' }
    ];

    const HOTEL_CATEGORIES = [
        { name: 'Luxury Resort', slug: 'luxury-resort', display_order: 1 },
        { name: 'Boutique Hotel', slug: 'boutique-hotel', display_order: 2 },
        { name: 'Beach Hut', slug: 'beach-hut', display_order: 3 },
        { name: 'Villa', slug: 'villa', display_order: 4 },
        { name: 'Budget Hotel', slug: 'budget-hotel', display_order: 5 },
        { name: 'Hostel', slug: 'hostel', display_order: 6 },
        { name: 'Homestay', slug: 'homestay', display_order: 7 },
        { name: 'Heritage Hotel', slug: 'heritage', display_order: 8 },
        { name: 'Apartment', slug: 'apartment', display_order: 9 },
        { name: 'Casino Hotel', slug: 'casino-hotel', display_order: 10 }
    ];

    const ATTRACTION_TYPES = [
        { name: 'Beach', slug: 'beach' },
        { name: 'Fort', slug: 'fort' },
        { name: 'Church', slug: 'church' },
        { name: 'Temple', slug: 'temple' },
        { name: 'Waterfall', slug: 'waterfall' },
        { name: 'Spice Plantation', slug: 'spice-plantation' },
        { name: 'Museum', slug: 'museum' },
        { name: 'Market', slug: 'market' },
        { name: 'Wildlife Sanctuary', slug: 'wildlife-sanctuary' },
        { name: 'Heritage Site', slug: 'heritage-site' },
        { name: 'Cave', slug: 'cave' },
        { name: 'Lake', slug: 'lake' },
        { name: 'Viewpoint', slug: 'viewpoint' }
    ];

    // --- SEEDING FUNCTIONS ---

    async function seedCollection(collectionName: string, data: any[]) {
        // Check if collection is empty
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.limit(1).get();

        if (!snapshot.empty) {
            console.log(`[SKIP] Collection '${collectionName}' is not empty.`);
            return;
        }

        console.log(`[SEED] Seeding '${collectionName}' with ${data.length} items...`);
        const batch = db.batch();

        data.forEach((item) => {
            // Generate an ID if one doesn't exist, using slug as ID for readability/SEO mapping if checked
            const id = item.slug || collectionRef.doc().id;
            const docRef = collectionRef.doc(id);
            batch.set(docRef, { ...item, id }); // Ensure ID is in the doc
        });

        await batch.commit();
        console.log(`[SUCCESS] Seeded '${collectionName}'.`);
    }

    console.log('Starting migration seeding...');

    // Seed Restaurants Cuisines
    await seedCollection('restaurants_cuisines', CUISINES.map((c, i) => ({ ...c, display_order: i + 1 })));

    // Seed Hotel Categories
    await seedCollection('hotel_categories', HOTEL_CATEGORIES);

    // Seed Attraction Types
    await seedCollection('attraction_types', ATTRACTION_TYPES);

    console.log('Seeding completed successfully.');
}

main().catch(console.error);
