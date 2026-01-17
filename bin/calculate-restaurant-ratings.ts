import * as dotenv from 'dotenv';
import path from 'path';
import { adminDb } from '../src/lib/firebase/admin';
import { ratingCalculator } from '../src/lib/services/rating-calculator';
import { sentimentAnalyzer } from '../src/lib/services/sentiment-analyzer';
import { tripadvisorScraper } from '../src/lib/services/tripadvisor-scraper';
import { RestaurantForRating, RestaurantRatings } from '../src/lib/services/rating-types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Batch Rating Calculator
 * Calculates ratings for all restaurants and stores them in Firestore
 */

async function processRestaurant(restaurant: any, index: number, total: number) {
    console.log(`\n[${index + 1}/${total}] Processing: ${restaurant.name}`);

    try {
        // Step 1: Fetch TripAdvisor data
        let tripadvisorData;
        console.log('  > Searching TripAdvisor...');
        try {
            tripadvisorData = await tripadvisorScraper.searchRestaurant(
                restaurant.name,
                restaurant.area || 'Goa'
            );

            if (tripadvisorData.found) {
                console.log(`  ✓ TripAdvisor: ${tripadvisorData.rating}/5 (${tripadvisorData.count} reviews)`);
            } else {
                console.log('  ⚠ No TripAdvisor listing found');
            }
        } catch (error) {
            console.log('  ✗ TripAdvisor fetch failed:', error);
            tripadvisorData = { rating: 0, count: 0, found: false };
        }

        // Step 2: Analyze sentiment from reviews
        let sentimentModifiers;
        console.log('  > Analyzing review sentiment...');
        try {
            sentimentModifiers = await sentimentAnalyzer.analyzeSentiment(restaurant.reviews || []);
            console.log(`  ✓ Sentiment: Food ${sentimentModifiers.foodQualityModifier > 0 ? '+' : ''}${sentimentModifiers.foodQualityModifier.toFixed(2)}, Service ${sentimentModifiers.serviceModifier > 0 ? '+' : ''}${sentimentModifiers.serviceModifier.toFixed(2)}`);
        } catch (error) {
            console.log('  ✗ Sentiment analysis failed:', error);
            sentimentModifiers = undefined;
        }

        // Step 3: Calculate ratings
        console.log('  > Calculating component scores...');
        const ratings: RestaurantRatings = await ratingCalculator.calculateRatings(
            restaurant as RestaurantForRating,
            tripadvisorData.found ? tripadvisorData : undefined,
            sentimentModifiers
        );

        console.log(`  ✓ Overall: ${ratings.overall_score}/10 (${ratings.score_label})`);
        console.log(`     Food: ${ratings.food_quality_score} | Service: ${ratings.service_score} | Ambience: ${ratings.ambience_score}`);

        // Step 4: Store in Firestore
        console.log('  > Saving to database...');
        await adminDb.collection('restaurants').doc(restaurant.id).update({
            // Overall
            overall_score: ratings.overall_score,
            score_label: ratings.score_label,

            // Components
            food_quality_score: ratings.food_quality_score,
            service_score: ratings.service_score,
            ambience_score: ratings.ambience_score,
            value_score: ratings.value_score,
            accessibility_score: ratings.accessibility_score,

            // Metadata
            rating_sources: ratings.rating_sources,
            total_review_count: ratings.total_review_count,
            sentiment_analyzed: ratings.sentiment_analyzed,
            last_rating_update: ratings.last_rating_update,
        });

        console.log('  ✅ Success!');
        return { success: true, restaurant: restaurant.name };
    } catch (error) {
        console.error(`  ❌ Failed to process ${restaurant.name}:`, error);
        return { success: false, restaurant: restaurant.name, error };
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  Restaurant Rating Batch Calculator (v3.1)    ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Fetch all restaurants
    console.log('Fetching restaurants from database...');
    const snapshot = await adminDb.collection('restaurants').get();

    if (snapshot.empty) {
        console.log('No restaurants found in database.');
        return;
    }

    const restaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${restaurants.length} restaurants.\n`);

    // Process restaurants sequentially
    const results = [];
    for (let i = 0; i < restaurants.length; i++) {
        const result = await processRestaurant(restaurants[i], i, restaurants.length);
        results.push(result);

        // Small delay to avoid rate limiting
        if (i < restaurants.length - 1) {
            await new Promise(r => setTimeout(r, 2000)); // 2 second delay
        }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              BATCH SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`Total Processed: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (failed.length > 0) {
        console.log('\nFailed Restaurants:');
        failed.forEach(f => console.log(`  - ${f.restaurant}`));
    }

    console.log('\n✨ Batch calculation complete!');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
