/**
 * Backfill Script: Calculate BOK Scores for Existing Attractions
 * 
 * This script calculates Best of Goa scores for attractions that were extracted
 * before the BOK score calculation step was added to the attraction orchestrator.
 * 
 * Usage:
 * npx tsx src/scripts/calculate-attraction-bok-scores.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ratingService } from '../lib/services/rating-service';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function calculateBOKScoresForAllAttractions() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[BOK Score Backfill] Starting BOK score calculation for all attractions...\n');

  try {
    // Fetch all active attractions without BOK scores
    const { data: attractions, error } = await supabase
      .from('attractions')
      .select('id, name, google_rating, google_review_count, tripadvisor_rating, tripadvisor_review_count, review_sentiment, is_free, admission_fee, attraction_amenity_ids, description, short_description, attraction_type')
      .eq('active', true)
      .is('bok_score', null);

    if (error) {
      console.error('Error fetching attractions:', error);
      return;
    }

    if (!attractions || attractions.length === 0) {
      console.log('âœ… No attractions found without BOK scores. All attractions are up to date!');
      return;
    }

    console.log(`Found ${attractions.length} attractions without BOK scores\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each attraction
    for (const attraction of attractions) {
      try {
        console.log(`\nðŸ“ Processing: ${attraction.name} (ID: ${attraction.id})`);

        // Prepare rating data
        const ratingData = {
          google_rating: attraction.google_rating,
          google_review_count: attraction.google_review_count,
          tripadvisor_rating: attraction.tripadvisor_rating,
          tripadvisor_review_count: attraction.tripadvisor_review_count,
          review_sentiment: attraction.review_sentiment,
          is_free: attraction.is_free,
          admission_fee: attraction.admission_fee,
          features: attraction.attraction_amenity_ids || [],
          description: attraction.description,
          short_description: attraction.short_description,
          attraction_type: attraction.attraction_type
        };

        // Calculate BOK score
        const ratingResult = await ratingService.calculateAttractionRating(ratingData);

        // Update attraction in database
        const { error: updateError } = await supabase
          .from('attractions')
          .update({
            bok_score: ratingResult.overall_rating,
            bok_score_breakdown: ratingResult.rating_breakdown,
            total_reviews_aggregated: ratingResult.total_reviews_aggregated,
            bok_score_calculated_at: new Date().toISOString(),
            bok_score_version: '1.0'
          })
          .eq('id', attraction.id);

        if (updateError) {
          console.error(`   âŒ Failed to update: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   âœ… BOK Score: ${ratingResult.overall_rating.toFixed(1)}/10`);
          console.log(`      Experience: ${ratingResult.rating_breakdown.experience.toFixed(1)}`);
          console.log(`      Cultural Value: ${ratingResult.rating_breakdown.cultural_value.toFixed(1)}`);
          console.log(`      Accessibility: ${ratingResult.rating_breakdown.accessibility.toFixed(1)}`);
          console.log(`      Facilities: ${ratingResult.rating_breakdown.facilities.toFixed(1)}`);
          console.log(`      Value for Money: ${ratingResult.rating_breakdown.value_for_money.toFixed(1)}`);
          console.log(`      Uniqueness: ${ratingResult.rating_breakdown.uniqueness.toFixed(1)}`);
          successCount++;
        }

      } catch (error) {
        console.error(`   âŒ Error processing attraction: ${error}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ðŸ“Š SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Attractions: ${attractions.length}`);
    console.log(`âœ… Successfully processed: ${successCount}`);
    console.log(`âŒ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('[BOK Score Backfill] Fatal error:', error);
  }
}

// Run the script
calculateBOKScoresForAllAttractions()
  .then(() => {
    console.log('Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
































