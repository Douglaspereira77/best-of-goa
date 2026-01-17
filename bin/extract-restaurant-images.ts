import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { apifyClient } from '@/lib/services/apify-client';
import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Extraction Script for Restaurant Images
 * 
 * Usage: npx tsx bin/extract-restaurant-images.ts
 */

const DOWNLOAD_TIMEOUT = 30000;
const UPLOAD_TIMEOUT = 30000;

function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
}

async function downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: DOWNLOAD_TIMEOUT });
    return Buffer.from(response.data);
}

async function uploadToFirebase(buffer: Buffer, filename: string, slug: string): Promise<string> {
    const bucket = adminStorage.bucket();
    const path = `restaurants/${slug}/images/${filename}`;
    const file = bucket.file(path);

    await file.save(buffer, { metadata: { contentType: 'image/jpeg' } });
    await file.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${path}`;
    return url;
}

// Generate a clean filename for SEO
function generateSEOFilename(restaurantSlug: string, index: number): string {
    return `${restaurantSlug}-view-${index + 1}.jpg`;
}

async function processRestaurant(restaurant: any) {
    if (!restaurant.slug) {
        console.warn(`[WARN] Skipping restaurant ${restaurant.id} - No slug found.`);
        return;
    }

    console.log(`\n---------------------------------------------------------`);
    console.log(`Processing: ${restaurant.name} (${restaurant.id})`);

    // 1. Search Google Places via Apify
    const searchQuery = `${restaurant.name} ${restaurant.area || ''} Goa restaurant`;
    console.log(`Searching: "${searchQuery}"`);

    let placesResults = [];
    try {
        placesResults = await apifyClient.searchGooglePlaces(searchQuery, 1);
    } catch (e) {
        console.error(`[ERROR] Apify search failed for ${restaurant.name}:`, e);
        return;
    }

    if (!placesResults || placesResults.length === 0) {
        console.log(`[WARN] No results found on Google Places for ${restaurant.name}`);
        return;
    }

    const place = placesResults[0]; // Take the best match
    console.log(`Found Place: ${place.name} (${place.address})`);

    // 2. Extract Images
    const imageUrls: string[] = place.imageUrls || [];
    if (imageUrls.length === 0) {
        console.log(`[WARN] No images found in Apify result for ${restaurant.name}`);
        return;
    }

    console.log(`Found ${imageUrls.length} images to process.`);

    const uploadedImages = [];
    let heroImage = restaurant.hero_image;

    // Process up to 5 images
    const maxImages = Math.min(imageUrls.length, 5);

    for (let i = 0; i < maxImages; i++) {
        const imgUrl = imageUrls[i];
        console.log(`  > Processing image ${i + 1}/${maxImages}...`);

        try {
            // Download
            const buffer = await withTimeout(
                downloadImage(imgUrl),
                DOWNLOAD_TIMEOUT,
                `Download img ${i}`
            );

            // Upload
            const filename = generateSEOFilename(restaurant.slug, i);
            const firebaseUrl = await withTimeout(
                uploadToFirebase(buffer, filename, restaurant.slug),
                UPLOAD_TIMEOUT,
                `Upload img ${i}`
            );

            uploadedImages.push({
                url: firebaseUrl,
                alt: `${restaurant.name} view ${i + 1}`,
                is_hero: i === 0 && !heroImage // Make first image hero if none exists
            });

            if (i === 0 && !heroImage) {
                heroImage = firebaseUrl;
                console.log(`    -> Set as New Hero Image`);
            }

        } catch (err) {
            console.error(`    [ERROR] Failed to process image ${i}:`, err);
        }
    }

    // 3. Update Database
    if (uploadedImages.length > 0) {
        try {
            await adminDb.collection('restaurants').doc(restaurant.id).update({
                images: uploadedImages,
                hero_image: heroImage,
                updated_at: new Date().toISOString(),
                google_place_id: place.placeId || restaurant.google_place_id, // Store place ID for future reference
                google_rating: place.totalScore || restaurant.google_rating,
                google_reviews_count: place.reviewsCount || restaurant.google_reviews_count
            });
            console.log(`[SUCCESS] Updated ${restaurant.name} with ${uploadedImages.length} images.`);
        } catch (dbErr) {
            console.error(`[ERROR] DB Update failed for ${restaurant.name}:`, dbErr);
        }
    } else {
        console.log(`[INFO] No images successfully uploaded for ${restaurant.name}.`);
    }
}

async function main() {
    console.log(`Starting Image Extraction Job...`);

    // Fetch restaurants that are 'active' but might strictly lack images
    // Or just fetch all and check locally
    const snapshot = await adminDb.collection('restaurants').get();

    if (snapshot.empty) {
        console.log('No restaurants found in database.');
        return;
    }

    const restaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${restaurants.length} restaurants total.`);

    // Filter for those needing images (Logic: no hero_image or empty images array)
    const targets = restaurants.filter((r: any) =>
        !r.hero_image || !r.images || r.images.length === 0
    );

    console.log(`Targeting ${targets.length} restaurants for image extraction.`);

    // Process sequentially to be gentle on APIs
    for (const restaurant of targets) {
        await processRestaurant(restaurant);
        // Small delay between items
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nJob Complete!`);
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal Script Error:', err);
    process.exit(1);
});
