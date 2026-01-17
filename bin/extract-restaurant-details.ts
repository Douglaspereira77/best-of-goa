
import { adminDb } from '@/lib/firebase/admin';
import { firecrawlClient } from '@/lib/services/firecrawl-client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Extraction Script for Restaurant Details (Firecrawl)
 * 
 * Usage: npx tsx bin/extract-restaurant-details.ts
 */

const WAIT_BETWEEN_REQUESTS = 2000;

async function processRestaurant(restaurant: any) {
    if (!restaurant.slug) return;

    console.log(`\n---------------------------------------------------------`);
    console.log(`Processing: ${restaurant.name} (${restaurant.id})`);

    let websiteUrl = restaurant.website;
    let updates: any = {};

    // 1. Find Website if missing
    if (!websiteUrl) {
        console.log(`  > Website missing. Searching...`);
        try {
            const searchResult = await firecrawlClient.searchRestaurant(`${restaurant.name} ${restaurant.area || ''} Goa official website`);
            if (searchResult && searchResult.results && searchResult.results.length > 0) {
                // heuristic: take first non-delivery result if possible, else first
                const firstResult = searchResult.results[0];
                websiteUrl = firstResult.url;
                console.log(`  > Found Website: ${websiteUrl}`);
                updates.website = websiteUrl;
            } else {
                console.log(`  > Could not find website.`);
            }
        } catch (e) {
            console.error(`  > Search failed:`, e);
        }
    }

    if (!websiteUrl) {
        console.log(`  [SKIP] No website available for extraction.`);
        return;
    }

    // 2. Extract Social Media
    if (!restaurant.instagram && !restaurant.facebook) {
        console.log(`  > Extracting Social Media...`);
        try {
            const socials = await firecrawlClient.extractSocialMediaHandles(websiteUrl);
            if (socials.success) {
                if (socials.instagram_url) updates.instagram = socials.instagram_url;
                if (socials.facebook_url) updates.facebook = socials.facebook_url;
                if (socials.twitter_url) updates.twitter = socials.twitter_url;
                console.log(`  > Found Socials:`, {
                    insta: socials.instagram_url,
                    fb: socials.facebook_url
                });
            }
        } catch (e) {
            console.error(`  > Social extraction failed:`, e);
        }
    }

    // 3. Extract Menu
    if (!restaurant.menu_link && !restaurant.menu_text) {
        console.log(`  > Extracting Menu...`);
        try {
            const menuData = await firecrawlClient.extractMenuFromWebsite(websiteUrl);
            if (menuData && menuData.scraped_content && menuData.scraped_content.length > 0) {
                const content = menuData.scraped_content[0];
                // Store a link if it was a menu page, or just flag it
                updates.has_menu_extracted = true;
                updates.menu_source_url = content.url;

                // If the scraped URL is different from main website and looks like a menu, save it
                if (content.url !== websiteUrl) {
                    updates.menu_link = content.url;
                }

                console.log(`  > Menu Extracted from: ${content.url}`);
            }
        } catch (e) {
            console.error(`  > Menu extraction failed:`, e);
        }
    }

    // 4. Update DB
    if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        try {
            await adminDb.collection('restaurants').doc(restaurant.id).update(updates);
            console.log(`[SUCCESS] Updated ${restaurant.name} with details.`);
        } catch (e) {
            console.error(`[ERROR] DB Update failed:`, e);
        }
    } else {
        console.log(`[INFO] No new details found.`);
    }
}

async function main() {
    console.log(`Starting Firecrawl Detail Extraction Job...`);

    // Fetch all active restaurants
    const snapshot = await adminDb.collection('restaurants').get();
    if (snapshot.empty) {
        console.log('No restaurants found.');
        return;
    }

    const restaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${restaurants.length} restaurants total.`);

    // Loop
    for (const restaurant of restaurants) {
        await processRestaurant(restaurant);
        await new Promise(r => setTimeout(r, WAIT_BETWEEN_REQUESTS));
    }

    console.log(`\nJob Complete!`);
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal Script Error:', err);
    process.exit(1);
});
