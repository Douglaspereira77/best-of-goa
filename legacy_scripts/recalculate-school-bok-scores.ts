/**
 * Force Recalculate BOK Scores for All Schools
 * 
 * This script recalculates BOK scores for ALL schools, even if they
 * already have scores. Use this after algorithm changes.
 * 
 * Usage:
 * npx tsx src/scripts/recalculate-school-bok-scores.ts
 */

import { createClient } from '@supabase/supabase-js';
import { ratingService } from '../lib/services/rating-service';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function recalculateAllSchoolBOKScores() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🎓 Recalculating ALL School BOK Scores (Data-Driven Algorithm)...\n');

  try {
    // Fetch ALL active schools (regardless of existing scores)
    const { data: schools, error: fetchError } = await supabase
      .from('schools')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching schools:', fetchError);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('❌ No schools found in the database.');
      return;
    }

    console.log(`📊 Recalculating scores for ${schools.length} schools\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      console.log(`\n[${i + 1}/${schools.length}] ${school.name}`);
      console.log(`   Curriculum: ${school.curriculum?.join(', ') || 'None'}`);
      console.log(`   Type: ${school.school_type || 'N/A'}`);

      try {
        // Prepare rating data
        const ratingData = {
          google_rating: school.google_rating, // Not used in new algorithm
          google_review_count: school.google_review_count, // Not used
          review_sentiment: school.review_sentiment,
          curriculum: school.curriculum,
          school_type: school.school_type,
          facilities: school.facilities,
          programs: school.programs,
          features: school.features,
          description: school.description,
          short_description: school.short_description,
        };

        // Calculate NEW BOK Score (data-driven, no Google reviews)
        const ratingResult = await ratingService.calculateSchoolRating(ratingData);

        // Update school record
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
          console.error(`   ❌ Error updating:`, updateError.message);
          errorCount++;
          continue;
        }

        console.log(`   ✅ NEW BOK Score: ${ratingResult.overall_rating.toFixed(2)}/10`);
        console.log(`   📊 Breakdown:`);
        console.log(`      • Academic: ${ratingResult.rating_breakdown.academic_excellence.toFixed(1)}`);
        console.log(`      • Facilities: ${ratingResult.rating_breakdown.facilities_quality.toFixed(1)}`);
        console.log(`      • Teachers: ${ratingResult.rating_breakdown.teacher_quality.toFixed(1)}`);
        console.log(`      • Programs: ${ratingResult.rating_breakdown.programs_activities.toFixed(1)}`);
        console.log(`      • Environment: ${ratingResult.rating_breakdown.environment_safety.toFixed(1)}`);
        console.log(`      • Value: ${ratingResult.rating_breakdown.value_for_money.toFixed(1)}`);

        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Failed:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 RECALCULATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Successfully recalculated: ${successCount} schools`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount} schools`);
    }
    console.log(`📊 Total processed: ${schools.length} schools`);
    console.log('\n🎯 NEW ALGORITHM: 100% data-driven, no Google reviews');

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the script
recalculateAllSchoolBOKScores()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
































