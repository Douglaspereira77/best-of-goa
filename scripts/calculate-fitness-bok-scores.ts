/**
 * Calculate BOK scores for existing fitness places
 * Uses ONLY data already in the database - NO API calls
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getRatingService } from '../src/lib/services/rating-service';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function calculateBOKScores() {
  console.log('🏋️  Calculating BOK Scores for Fitness Places\n');
  console.log('⚠️  Using ONLY existing database data - NO API calls\n');

  // Get all fitness places that have Google rating data
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, google_rating, google_review_count, facebook_rating, facebook_review_count, review_sentiment, amenities, fitness_types, gender_policy, open_24_hours, awards, description, short_description, apify_output')
    .not('google_rating', 'is', null)
    .not('google_review_count', 'is', null);

  if (error) {
    console.error('Error fetching fitness places:', error);
    return;
  }

  console.log(`Found ${fitnessPlaces.length} fitness places with rating data\n`);

  const ratingService = getRatingService();
  let successCount = 0;
  let errorCount = 0;

  for (const fp of fitnessPlaces || []) {
    try {
      console.log(`Calculating BOK score for: ${fp.name}`);

      // Prepare rating data from existing database fields
      const ratingData = {
        google_rating: fp.google_rating,
        google_review_count: fp.google_review_count,
        facebook_rating: fp.facebook_rating,
        facebook_review_count: fp.facebook_review_count,
        review_sentiment: fp.review_sentiment,
        amenities: fp.amenities,
        fitness_types: fp.fitness_types,
        gender_policy: fp.gender_policy,
        open_24_hours: fp.open_24_hours,
        awards: fp.awards,
        description: fp.description,
        short_description: fp.short_description,
        apify_output: fp.apify_output
      };

      // Calculate the BOK score
      const ratingResult = await ratingService.calculateFitnessRating(ratingData);

      // Update fitness place with BOK score
      const { error: updateError } = await supabase
        .from('fitness_places')
        .update({
          bok_score: ratingResult.overall_rating,
          bok_score_breakdown: ratingResult.rating_breakdown,
          total_reviews_aggregated: ratingResult.total_reviews_aggregated,
          bok_score_calculated_at: new Date().toISOString(),
          bok_score_version: '1.0'
        })
        .eq('id', fp.id);

      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ BOK Score: ${ratingResult.overall_rating.toFixed(1)}/10`);
        console.log(`     Equipment: ${ratingResult.rating_breakdown.equipment.toFixed(1)}, Cleanliness: ${ratingResult.rating_breakdown.cleanliness.toFixed(1)}, Staff: ${ratingResult.rating_breakdown.staff.toFixed(1)}`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`  ❌ Error calculating score for ${fp.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
}

calculateBOKScores().catch(console.error);

