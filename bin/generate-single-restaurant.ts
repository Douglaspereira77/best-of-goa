
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import { OpenAIClient } from '../src/lib/services/openai-client';
import { RestaurantAIInput } from '../src/lib/services/ai-types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function main() {
    const targetSlug = process.argv[2];
    if (!targetSlug) {
        console.error('Please provide a slug provided as an argument.');
        process.exit(1);
    }

    console.log(`Generating content for single restaurant: ${targetSlug}`);

    if (!process.env.OPENAI_API_KEY) {
        console.error('ERROR: OPENAI_API_KEY is missing');
        process.exit(1);
    }

    const openaiClient = new OpenAIClient(process.env.OPENAI_API_KEY);

    try {
        const doc = await db.collection('restaurants').doc(targetSlug).get();
        if (!doc.exists) {
            console.error(`Restaurant ${targetSlug} not found!`);
            process.exit(1);
        }

        const restaurant = doc.data();
        if (!restaurant) return;

        console.log(`Found ${restaurant.name}. Preparing AI input...`);

        const input: RestaurantAIInput = {
            name: restaurant.name,
            address: restaurant.address,
            area: restaurant.area,
            place_data: {
                google_rating: restaurant.rating,
                price_level: restaurant.price_level
            },
            reviews: restaurant.reviews || [],
            menu_items: [],
            website_content: restaurant.website_text || '',
            apify_data: restaurant.apify_output || {},
            firecrawl_data: restaurant.firecrawl_output || {},
            menu_data: restaurant.menu_data || {},
            firecrawl_menu_data: restaurant.firecrawl_menu_data || {}
        };

        const aiContent = await openaiClient.generateRestaurantContent(input);

        await db.collection('restaurants').doc(targetSlug).update({
            description: aiContent.description,
            short_description: aiContent.short_description,
            seo_metadata: {
                meta_title: aiContent.meta_title,
                meta_description: aiContent.meta_description,
                generated_at: new Date().toISOString()
            },
            review_sentiment: aiContent.review_sentiment,
            faqs: aiContent.faqs,
            cuisines: restaurant.cuisines?.length ? restaurant.cuisines : aiContent.cuisine_suggestions.map(c => ({ name: c, slug: c.toLowerCase().replace(/\s+/g, '-') })),
            features: restaurant.features?.length ? restaurant.features : aiContent.feature_suggestions.map(f => ({ name: f, id: f.toLowerCase().replace(/\s+/g, '-') })),
            dishes: aiContent.dishes,
            popular_dishes: aiContent.popular_dishes,
            location_details: aiContent.location_details,
            operational: aiContent.operational,
            contact_info: { ...restaurant.contact_info, ...aiContent.contact_info },
            special_features: aiContent.special_features,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[SUCCESS] Content updated for ${restaurant.name}`);
        console.log(`Description preview: ${aiContent.description.substring(0, 100)}...`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
