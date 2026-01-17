
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// Static imports for utils
import { getDistrictFromArea } from '../lib/utils/goa-locations';

async function main() {
    // Dynamic imports for dependencies requiring env vars
    const { adminDb } = await import('../lib/firebase/admin');
    const { apifyClient } = await import('../lib/services/apify-client');

    if (!adminDb) {
        console.error('Firebase Admin not initialized');
        process.exit(1);
    }
    const db = adminDb;

    // Helpers
    function slugify(text: string): string {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function mapPriceLevel(priceString?: string): number {
        if (!priceString) return 2; // Default to medium
        return priceString.length; // e.g. "$$" -> 2
    }

    // Logic
    const targetAreas = ['Panjim', 'Calangute'];
    console.log(`Starting extraction for areas: ${targetAreas.join(', ')}`);

    for (const area of targetAreas) {
        const query = `Restaurants in ${area}, Goa`;
        console.log(`\n--- Processing Query: ${query} ---`);

        try {
            const places = await apifyClient.searchGooglePlaces(query, 10);
            console.log(`Found ${places.length} places for ${area}`);

            const batch = db.batch();
            let operationsCount = 0;

            for (const place of places) {
                if (!place.title) continue;

                // Create a unique slug using name and area to avoid collisions
                const slug = slugify(`${place.title}-${area}`);
                const docRef = db.collection('restaurants').doc(slug);

                // Map Apify data to Firestore schema
                const restaurantData = {
                    id: slug,
                    name: place.title,
                    slug: slug,
                    area: area,
                    district: getDistrictFromArea(area),
                    address: place.address,
                    location: place.location ? { lat: place.location.lat, lng: place.location.lng } : null,
                    google_rating: place.totalScore || 0,
                    google_review_count: place.reviewsCount || 0,
                    website: place.website || null,
                    phone: place.phone || null,
                    price_level: mapPriceLevel(place.price),
                    active: true,
                    extraction_status: 'completed',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    // Store raw output
                    apify_output: place
                };

                batch.set(docRef, restaurantData, { merge: true });
                operationsCount++;
            }

            if (operationsCount > 0) {
                await batch.commit();
                console.log(`Saved ${operationsCount} restaurants for ${area}`);
            }

        } catch (error) {
            console.error(`Error extracting for ${area}:`, error);
        }
    }

    console.log('\nExtraction completed.');
}

main().catch(console.error);
