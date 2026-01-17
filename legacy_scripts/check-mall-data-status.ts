/**
 * Mall Data Status Checker
 * 
 * Analyzes existing malls to see what data fields are populated
 * and what needs attention.
 * 
 * Usage:
 * npx tsx src/scripts/check-mall-data-status.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkMallDataStatus() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking Mall Data Status...\n');

  try {
    // Fetch all active malls
    const { data: malls, error } = await supabase
      .from('malls')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching malls:', error);
      return;
    }

    if (!malls || malls.length === 0) {
      console.log('❌ No malls found in the database.');
      return;
    }

    console.log(`📊 Total Active Malls: ${malls.length}\n`);
    console.log('=' .repeat(80));

    // Analyze data completeness
    const fields = {
      // Core identification
      'name': 0,
      'slug': 0,
      'address': 0,
      'area': 0,
      'google_place_id': 0,
      
      // Contact
      'phone': 0,
      'email': 0,
      'website': 0,
      'instagram': 0,
      'facebook': 0,
      
      // Mall specific
      'total_stores': 0,
      'total_floors': 0,
      'total_parking_spaces': 0,
      'year_opened': 0,
      'mall_type': 0,
      
      // Ratings
      'google_rating': 0,
      'google_review_count': 0,
      'bok_score': 0,
      
      // Content
      'description': 0,
      'short_description': 0,
      'review_sentiment': 0,
      
      // Parking
      'parking_type': 0,
      'valet_parking': 0,
      'parking_fee': 0,
      'ev_charging_stations': 0,
      
      // Special
      'special_features': 0,
      
      // Arrays
      'mall_category_ids': 0,
      'mall_amenity_ids': 0,
      'mall_anchor_store_ids': 0,
      
      // Operating hours
      'weekday_open_time': 0,
      'friday_open_time': 0,
      
      // Extraction
      'extraction_status': 0,
    };

    // Count populated fields
    malls.forEach((mall: any) => {
      Object.keys(fields).forEach((field) => {
        const value = mall[field];
        if (value !== null && value !== undefined && value !== '') {
          // For arrays, check if they have items
          if (Array.isArray(value)) {
            if (value.length > 0) fields[field as keyof typeof fields]++;
          } else {
            fields[field as keyof typeof fields]++;
          }
        }
      });
    });

    // Display results
    console.log('\n📈 DATA COMPLETENESS REPORT\n');
    console.log('Field'.padEnd(30) + 'Populated'.padEnd(15) + 'Percentage');
    console.log('-'.repeat(80));

    Object.entries(fields)
      .sort((a, b) => (b[1] / malls.length) - (a[1] / malls.length))
      .forEach(([field, count]) => {
        const percentage = ((count / malls.length) * 100).toFixed(1);
        const status = count === malls.length ? '✅' : count > malls.length / 2 ? '⚠️ ' : '❌';
        console.log(
          `${status} ${field.padEnd(27)} ${count.toString().padStart(3)}/${malls.length.toString().padEnd(3)} ${percentage.padStart(6)}%`
        );
      });

    // Critical missing fields
    console.log('\n' + '='.repeat(80));
    console.log('🚨 CRITICAL MISSING DATA\n');

    const criticalFields = [
      'review_sentiment',
      'bok_score',
      'description',
      'special_features',
      'mall_amenity_ids',
      'mall_category_ids'
    ];

    criticalFields.forEach((field) => {
      const count = fields[field as keyof typeof fields];
      const missing = malls.length - count;
      if (missing > 0) {
        console.log(`• ${field}: ${missing} malls missing this data`);
      }
    });

    // Show sample malls
    console.log('\n' + '='.repeat(80));
    console.log('📝 SAMPLE MALLS (First 5)\n');

    malls.slice(0, 5).forEach((mall: any, index: number) => {
      console.log(`${index + 1}. ${mall.name}`);
      console.log(`   Slug: ${mall.slug || 'MISSING'}`);
      console.log(`   Status: ${mall.extraction_status || 'unknown'}`);
      console.log(`   BOK Score: ${mall.bok_score ? mall.bok_score.toFixed(1) : 'NOT CALCULATED'}`);
      console.log(`   Description: ${mall.description ? 'YES' : 'NO'}`);
      console.log(`   Review Sentiment: ${mall.review_sentiment ? 'YES' : 'NO'}`);
      console.log(`   Amenities: ${mall.mall_amenity_ids?.length || 0} items`);
      console.log(`   Categories: ${mall.mall_category_ids?.length || 0} items`);
      console.log(`   Special Features: ${mall.special_features?.length || 0} items`);
      console.log('');
    });

    // Recommendations
    console.log('=' .repeat(80));
    console.log('💡 RECOMMENDATIONS\n');

    const missingReviewSentiment = malls.length - fields.review_sentiment;
    const missingBokScore = malls.length - fields.bok_score;
    const missingDescription = malls.length - fields.description;

    if (missingBokScore > 0) {
      console.log(`1. Run BOK Score Backfill Script:`);
      console.log(`   npx tsx src/scripts/calculate-mall-bok-scores.ts`);
      console.log(`   This will calculate scores for ${missingBokScore} malls.\n`);
    }

    if (missingReviewSentiment > 0) {
      console.log(`2. ${missingReviewSentiment} malls missing review_sentiment`);
      console.log(`   This is generated during extraction (Step 9: AI Sentiment Analysis)`);
      console.log(`   Re-run extraction for these malls.\n`);
    }

    if (missingDescription > 0) {
      console.log(`3. ${missingDescription} malls missing descriptions`);
      console.log(`   This is generated during extraction (Step 10: AI Enhancement)`);
      console.log(`   Re-run extraction for these malls.\n`);
    }

    console.log('=' .repeat(80));

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
checkMallDataStatus()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
































