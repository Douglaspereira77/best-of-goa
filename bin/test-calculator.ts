import * as dotenv from 'dotenv';
import path from 'path';
import { ratingCalculator } from '../src/lib/services/rating-calculator';
import { RestaurantForRating } from '../src/lib/services/rating-types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('Testing Rating Calculator with mock data...\n');

    const mockRestaurant: RestaurantForRating = {
        id: 'test-123',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        description: 'A wonderful test restaurant serving delicious food in a cozy atmosphere',
        price_level: 2,
        overall_rating: 4.2,
        total_reviews_aggregated: 150,
        features: [
            { id: 1, name: 'WiFi' },
            { id: 2, name: 'Parking' },
            { id: 3, name: 'Outdoor Seating' }
        ],
        cuisines: [
            { id: 1, name: 'Italian' }
        ],
        reviews: [],
        area: 'Panjim'
    };

    const ratings = await ratingCalculator.calculateRatings(
        mockRestaurant,
        undefined, // No TripAdvisor data
        undefined  // No sentiment modifiers
    );

    console.log('✅ Rating Calculation Complete!\n');
    console.log(`Overall Score: ${ratings.overall_score}/10 (${ratings.score_label})`);
    console.log(`Component Scores:`);
    console.log(`  Food Quality: ${ratings.food_quality_score}/10`);
    console.log(`  Service: ${ratings.service_score}/10`);
    console.log(`  Ambience: ${ratings.ambience_score}/10`);
    console.log(`  Value: ${ratings.value_score}/10`);
    console.log(`  Accessibility: ${ratings.accessibility_score}/10`);
    console.log(`\nTotal Reviews: ${ratings.total_review_count}`);

    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
