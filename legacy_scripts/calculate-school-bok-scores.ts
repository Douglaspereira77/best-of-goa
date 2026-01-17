/**
 * Backfill Script: Calculate BOK Scores for Schools
 * 
 * This script calculates Best of Goa scores for all existing schools
 * that don't have a BOK score yet. It uses the rating service with
 * school-specific components:
 * - Academic Excellence (30%)
 * - Facilities Quality (25%)
 * - Teacher Quality (20%)
 * - Programs & Activities (15%)
 * - Environment & Safety (5%)
 * - Value for Money (5%)
 * 
 * Usage:
 * npx tsx src/scripts/calculate-school-bok-scores.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ratingService } from '../lib/services/rating-service';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function calculateSchoolBOKScores() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('ðŸŽ“ Starting School BOK Score Backfill...\n');

  try {
    // 1. Fetch all active schools without BOK scores
    const { data: schools, error: fetchError } = await supabase
      .from('schools')
      .select('*')
      .eq('active', true)
      .is('bok_score', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('âŒ Error fetching schools:', fetchError);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('âœ… No schools need BOK score calculation. All schools already have scores!');
      return;
    }

    console.log(`ðŸ“Š Found ${schools.length} schools needing BOK score calculation\n`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Process each school
    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      console.log(`\n[${i + 1}/${schools.length}] Processing: ${school.name}`);
      console.log(`   School Type: ${school.school_type || 'N/A'}`);
      console.log(`   Curriculum: ${school.curriculum?.join(', ') || 'N/A'}`);
      console.log(`   Google Rating: ${school.google_rating || 'N/A'} (${school.google_review_count || 0} reviews)`);

      try {
        // 3. Prepare rating data
        const ratingData = {
          google_rating: school.google_rating,
          google_review_count: school.google_review_count,
          review_sentiment: school.review_sentiment,
          curriculum: school.curriculum,
          school_type: school.school_type,
          facilities: school.facilities,
          programs: school.programs,
          features: school.features,
          description: school.description,
          short_description: school.short_description,
        };

        // 4. Calculate BOK Score
        const ratingResult = await ratingService.calculateSchoolRating(ratingData);

        // 5. Update school record
        const { error: updateError } = await supabase
          .from('schools')
          .update({
            bok_score: ratingResult.overall_rating,
            bok_score_breakdown: ratingResult.rating_breakdown,
            total_reviews_aggregated: ratingResult.total_reviews_aggregated,
            bok_score_calculated_at: new Date().toISOString(),
            bok_score_version: ratingResult.rating_breakdown.algorithm_version,
          })
          .eq('id', school.id);

        if (updateError) {
          console.error(`   âŒ Error updating school:`, updateError.message);
          errorCount++;
          continue;
        }

        console.log(`   âœ… BOK Score: ${ratingResult.overall_rating.toFixed(2)}/10`);
        console.log(`   ðŸ“Š Breakdown:`);
        console.log(`      â€¢ Academic Excellence: ${ratingResult.rating_breakdown.academic_excellence.toFixed(1)}`);
        console.log(`      â€¢ Facilities Quality: ${ratingResult.rating_breakdown.facilities_quality.toFixed(1)}`);
        console.log(`      â€¢ Teacher Quality: ${ratingResult.rating_breakdown.teacher_quality.toFixed(1)}`);
        console.log(`      â€¢ Programs & Activities: ${ratingResult.rating_breakdown.programs_activities.toFixed(1)}`);
        console.log(`      â€¢ Environment & Safety: ${ratingResult.rating_breakdown.environment_safety.toFixed(1)}`);
        console.log(`      â€¢ Value for Money: ${ratingResult.rating_breakdown.value_for_money.toFixed(1)}`);

        successCount++;
      } catch (error: any) {
        console.error(`   âŒ Failed to calculate score:`, error.message);
        errorCount++;
      }
    }

    // 6. Summary
    console.log('\n' + '='.repeat(80));
    console.log('ðŸ“ˆ BACKFILL COMPLETE');
    console.log('='.repeat(80));
    console.log(`âœ… Successfully processed: ${successCount} schools`);
    if (errorCount > 0) {
      console.log(`âŒ Errors encountered: ${errorCount} schools`);
    }
    console.log(`ðŸ“Š Total processed: ${schools.length} schools`);

  } catch (error) {
    console.error('ðŸ’¥ Fatal error:', error);
  }
}

// Run the script
calculateSchoolBOKScores()
  .then(() => {
    console.log('\nâœ… Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
































