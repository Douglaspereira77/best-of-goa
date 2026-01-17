/**
 * Backfill Script: Calculate BOK Scores for Existing Malls
 * 
 * This script calculates Best of Goa scores for malls that were extracted
 * before the BOK score calculation step was added to the mall orchestrator.
 * 
 * Usage:
 * npx tsx src/scripts/calculate-mall-bok-scores.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ratingService } from '../lib/services/rating-service';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function calculateBOKScoresForAllMalls() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[BOK Score Backfill] Starting BOK score calculation for all malls...\n');

  try {
    // Fetch all active malls without BOK scores
    const { data: malls, error } = await supabase
      .from('malls')
      .select(`
        id, name, 
        google_rating, google_review_count, 
        tripadvisor_rating, tripadvisor_review_count, 
        review_sentiment,
        total_stores,
        mall_amenity_ids,
        mall_category_ids,
        special_features,
        description,
        short_description
      `)
      .eq('active', true)
      .is('bok_score', null);

    if (error) {
      console.error('Error fetching malls:', error);
      return;
    }

    if (!malls || malls.length === 0) {
      console.log('âœ… No malls found without BOK scores. All malls are up to date!');
      return;
    }

    console.log(`Found ${malls.length} malls without BOK scores\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each mall
    for (const mall of malls) {
      try {
        console.log(`\nðŸ¬ Processing: ${mall.name} (ID: ${mall.id})`);

        // Fetch related data
        let amenities: any[] = [];
        let categories: any[] = [];

        if (mall.mall_amenity_ids && mall.mall_amenity_ids.length > 0) {
          const { data: amenityData } = await supabase
            .from('mall_amenities')
            .select('id, name')
            .in('id', mall.mall_amenity_ids);
          amenities = amenityData || [];
        }

        if (mall.mall_category_ids && mall.mall_category_ids.length > 0) {
          const { data: categoryData } = await supabase
            .from('mall_categories')
            .select('id, name')
            .in('id', mall.mall_category_ids);
          categories = categoryData || [];
        }

        // Prepare rating data
        const ratingData = {
          google_rating: mall.google_rating,
          google_review_count: mall.google_review_count,
          tripadvisor_rating: mall.tripadvisor_rating,
          tripadvisor_review_count: mall.tripadvisor_review_count,
          review_sentiment: mall.review_sentiment,
          total_stores: mall.total_stores,
          amenities: amenities,
          categories: categories,
          special_features: mall.special_features || [],
          description: mall.description,
          short_description: mall.short_description,
        };

        // Calculate BOK score
        const ratingResult = await ratingService.calculateMallRating(ratingData);

        // Update mall in database
        const { error: updateError } = await supabase
          .from('malls')
          .update({
            bok_score: ratingResult.overall_rating,
            bok_score_breakdown: ratingResult.rating_breakdown,
            total_reviews_aggregated: ratingResult.total_reviews_aggregated,
            bok_score_calculated_at: new Date().toISOString(),
            bok_score_version: '1.0'
          })
          .eq('id', mall.id);

        if (updateError) {
          console.error(`   âŒ Failed to update: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   âœ… BOK Score: ${ratingResult.overall_rating.toFixed(1)}/10`);
          console.log(`      Variety: ${ratingResult.rating_breakdown.variety.toFixed(1)}`);
          console.log(`      Amenities: ${ratingResult.rating_breakdown.amenities.toFixed(1)}`);
          console.log(`      Accessibility: ${ratingResult.rating_breakdown.accessibility.toFixed(1)}`);
          console.log(`      Cleanliness: ${ratingResult.rating_breakdown.cleanliness.toFixed(1)}`);
          console.log(`      Atmosphere: ${ratingResult.rating_breakdown.atmosphere.toFixed(1)}`);
          console.log(`      Value: ${ratingResult.rating_breakdown.value.toFixed(1)}`);
          successCount++;
        }

      } catch (error) {
        console.error(`   âŒ Error processing mall: ${error}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('ðŸ“Š SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Malls: ${malls.length}`);
    console.log(`âœ… Successfully processed: ${successCount}`);
    console.log(`âŒ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('[BOK Score Backfill] Fatal error:', error);
  }
}

// Run the script
calculateBOKScoresForAllMalls()
  .then(() => {
    console.log('Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
































