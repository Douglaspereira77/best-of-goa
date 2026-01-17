
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import { OpenAIClient } from '../src/lib/services/openai-client';
import { RestaurantAIInput } from '../src/lib/services/ai-types';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function main() {
    console.log('Starting AI Content Generation for Restaurants...');

    if (!process.env.OPENAI_API_KEY) {
        console.error('ERROR: OPENAI_API_KEY is missing in .env.local');
        process.exit(1);
    }

    const openaiClient = new OpenAIClient(process.env.OPENAI_API_KEY);

    try {
        const snapshot = await db.collection('restaurants').get();
        console.log(`Found ${snapshot.size} restaurants to process.`);

        for (const doc of snapshot.docs) {
            const restaurant = doc.data();
            const slug = doc.id;

            console.log(`\n--------------------------------------------------`);
            console.log(`Processing: ${restaurant.name} (${slug})`);

            // Skip if already has rich content (optional check)
            if (restaurant.seo_metadata && restaurant.description && restaurant.description.length > 200) {
                console.log('Skipping: Already has rich content.');
                continue;
            }

            // Prepare Input for AI
            const input: RestaurantAIInput = {
                name: restaurant.name,
                address: restaurant.address,
                area: restaurant.area,
                place_data: {
                    google_rating: restaurant.rating,
                    price_level: restaurant.price_level
                },
                reviews: restaurant.reviews || [],
                menu_items: [], // Map extracted menu items if available
                website_content: restaurant.website_text || '', // From Firecrawl
                apify_data: restaurant.apify_output || {},
                firecrawl_data: restaurant.firecrawl_output || {},
                // Add extraction data if available
                menu_data: restaurant.menu_data || {},
                firecrawl_menu_data: restaurant.firecrawl_menu_data || {}
            };

            // Call OpenAI
            try {
                const aiContent = await openaiClient.generateRestaurantContent(input);

                // Update Firestore
                await db.collection('restaurants').doc(slug).update({
                    description: aiContent.description,
                    short_description: aiContent.short_description,
                    seo_metadata: {
                        meta_title: aiContent.meta_title,
                        meta_description: aiContent.meta_description,
                        generated_at: new Date().toISOString()
                    },
                    review_sentiment: aiContent.review_sentiment,
                    faqs: aiContent.faqs,
                    // Merge suggestions only if original is empty
                    cuisines: restaurant.cuisines?.length ? restaurant.cuisines : aiContent.cuisine_suggestions.map(c => ({ name: c, slug: c.toLowerCase().replace(/\s+/g, '-') })),
                    features: restaurant.features?.length ? restaurant.features : aiContent.feature_suggestions.map(f => ({ name: f, id: f.toLowerCase().replace(/\s+/g, '-') })),
                    // Add structured data
                    dishes: aiContent.dishes,
                    popular_dishes: aiContent.popular_dishes,
                    location_details: aiContent.location_details,
                    operational: aiContent.operational,
                    contact_info: { ...restaurant.contact_info, ...aiContent.contact_info }, // Merge
                    special_features: aiContent.special_features,

                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log(`[SUCCESS] Generated content for ${restaurant.name}`);

            } catch (err: any) {
                console.error(`[ERROR] Failed to generate content for ${restaurant.name}:`, err.message);
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

main();
