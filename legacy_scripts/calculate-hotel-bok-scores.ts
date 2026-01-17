/**
 * Backfill Script: Calculate BOK Scores for Existing Hotels
 * 
 * This script calculates Best of Goa scores for hotels that were extracted
 * before the BOK score calculation step was added to the hotel orchestrator.
 * 
 * Usage:
 * npx ts-node src/scripts/calculate-hotel-bok-scores.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ratingService } from '../lib/services/rating-service';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function calculateBOKScoresForAllHotels() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[BOK Score Backfill] Starting BOK score calculation for all hotels...\n');

  try {
    // Fetch all active hotels without BOK scores
    const { data: hotels, error } = await supabase
      .from('hotels')
      .select('id, name, google_rating, google_review_count, tripadvisor_rating, tripadvisor_review_count, booking_com_rating, booking_com_review_count, review_sentiment, price_range, hotel_amenity_ids, description, short_description')
      .eq('active', true)
      .is('bok_score', null);

    if (error) {
      console.error('Error fetching hotels:', error);
      return;
    }

    if (!hotels || hotels.length === 0) {
      console.log('âœ… No hotels found without BOK scores. All hotels are up to date!');
      return;
    }

    console.log(`Found ${hotels.length} hotels without BOK scores\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each hotel
    for (const hotel of hotels) {
      try {
        console.log(`\nðŸ“ Processing: ${hotel.name} (ID: ${hotel.id})`);

        // Prepare rating data
        const ratingData = {
          google_rating: hotel.google_rating,
          google_review_count: hotel.google_review_count,
          tripadvisor_rating: hotel.tripadvisor_rating,
          tripadvisor_review_count: hotel.tripadvisor_review_count,
          booking_com_rating: hotel.booking_com_rating,
          booking_com_review_count: hotel.booking_com_review_count,
          review_sentiment: hotel.review_sentiment,
          price_level: hotel.price_range ? (hotel.price_range.length) : null, // Convert $ to 1, $$ to 2, etc.
          features: hotel.hotel_amenity_ids || [],
          description: hotel.description,
          short_description: hotel.short_description
        };

        // Calculate BOK score
        const ratingResult = await ratingService.calculateHotelRating(ratingData);

        // Update hotel in database
        const { error: updateError } = await supabase
          .from('hotels')
          .update({
            bok_score: ratingResult.overall_rating,
            bok_score_breakdown: ratingResult.rating_breakdown,
            total_reviews_aggregated: ratingResult.total_reviews_aggregated,
            bok_score_calculated_at: new Date().toISOString(),
            bok_score_version: '1.0'
          })
          .eq('id', hotel.id);

        if (updateError) {
          console.error(`   âŒ Failed to update: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   âœ… BOK Score: ${ratingResult.overall_rating.toFixed(1)}/10`);
          console.log(`      Room Quality: ${ratingResult.rating_breakdown.room_quality.toFixed(1)}`);
          console.log(`      Service: ${ratingResult.rating_breakdown.service.toFixed(1)}`);
          console.log(`      Cleanliness: ${ratingResult.rating_breakdown.cleanliness.toFixed(1)}`);
          console.log(`      Location: ${ratingResult.rating_breakdown.location.toFixed(1)}`);
          console.log(`      Value: ${ratingResult.rating_breakdown.value_for_money.toFixed(1)}`);
          console.log(`      Amenities: ${ratingResult.rating_breakdown.amenities.toFixed(1)}`);
          successCount++;
        }

      } catch (error) {
        console.error(`   âŒ Error processing hotel: ${error}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ðŸ“Š SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Hotels: ${hotels.length}`);
    console.log(`âœ… Successfully processed: ${successCount}`);
    console.log(`âŒ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('[BOK Score Backfill] Fatal error:', error);
  }
}

// Run the script
calculateBOKScoresForAllHotels()
  .then(() => {
    console.log('Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

