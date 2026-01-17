/**
 * Fitness Data Diagnostic Script
 * 
 * Analyzes what data exists in apify_output vs what's extracted to database fields
 * Samples 10 fitness places to understand data gaps
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseFitnessData() {
  console.log('🔍 Fitness Data Diagnostic Report');
  console.log('==================================\n');

  // Get sample of fitness places (variety: high-rated, low-rated, different areas)
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('*')
    .order('google_rating', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Analyzing ${fitnessPlaces.length} fitness places...\n`);

  const report = {
    totalAnalyzed: fitnessPlaces.length,
    hasApifyData: 0,
    hasFirecrawlData: 0,
    hasOpeningHoursInApify: 0,
    hasDescriptionInApify: 0,
    hasImagesInApify: 0,
    hasAdditionalInfo: 0,
    extractedToDb: {
      opening_hours: 0,
      description: 0,
      short_description: 0,
      review_sentiment: 0,
      hero_image: 0,
      social_media: 0
    },
    dataGaps: []
  };

  fitnessPlaces.forEach((fp, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${index + 1}. ${fp.name} (${fp.area})`);
    console.log(`   Google: ${fp.google_rating}⭐ (${fp.google_review_count} reviews)`);
    console.log(`${'='.repeat(60)}`);

    // Check Apify data
    if (fp.apify_output) {
      report.hasApifyData++;
      const apify = fp.apify_output;

      console.log('\n✅ HAS APIFY DATA');
      console.log('   Available fields:', Object.keys(apify).length);

      // Opening Hours
      if (apify.openingHours && apify.openingHours.length > 0) {
        report.hasOpeningHoursInApify++;
        console.log('   ✅ Opening Hours:', apify.openingHours.length, 'days');
        console.log('      Sample:', JSON.stringify(apify.openingHours[0]));
      } else {
        console.log('   ❌ No Opening Hours in Apify');
      }

      // Description
      if (apify.description) {
        report.hasDescriptionInApify++;
        console.log('   ✅ Description:', apify.description.substring(0, 100) + '...');
      } else {
        console.log('   ❌ No Description in Apify');
      }

      // Images
      if (apify.imageUrls && apify.imageUrls.length > 0) {
        report.hasImagesInApify++;
        console.log('   ✅ Images:', apify.imageUrls.length, 'photos available');
      } else if (apify.imageUrl) {
        report.hasImagesInApify++;
        console.log('   ✅ Images: 1 photo available');
      } else {
        console.log('   ❌ No Images in Apify');
      }

      // Additional Info
      if (apify.additionalInfo) {
        const hasData = Object.values(apify.additionalInfo).some(v => v && v.trim());
        if (hasData) {
          report.hasAdditionalInfo++;
          console.log('   ✅ Additional Info:', Object.keys(apify.additionalInfo).filter(k => apify.additionalInfo[k]).join(', '));
        } else {
          console.log('   ℹ️  Additional Info: Empty fields');
        }
      }
    } else {
      console.log('\n❌ NO APIFY DATA');
    }

    // Check Firecrawl data
    if (fp.firecrawl_output) {
      report.hasFirecrawlData++;
      console.log('\n✅ HAS FIRECRAWL DATA');
      console.log('   Keys:', Object.keys(fp.firecrawl_output).join(', '));
    } else {
      console.log('\n❌ NO FIRECRAWL DATA');
    }

    // Check what's extracted to DB
    console.log('\n📊 EXTRACTED TO DATABASE:');
    
    if (fp.opening_hours) {
      report.extractedToDb.opening_hours++;
      const days = Object.keys(fp.opening_hours).length;
      console.log('   ✅ Opening Hours:', days, 'days mapped');
    } else {
      console.log('   ❌ Opening Hours: Not extracted');
    }

    if (fp.description) {
      report.extractedToDb.description++;
      console.log('   ✅ Description:', fp.description.length, 'chars');
    } else {
      console.log('   ❌ Description: Missing');
    }

    if (fp.short_description) {
      report.extractedToDb.short_description++;
      console.log('   ✅ Short Description:', fp.short_description.length, 'chars');
    } else {
      console.log('   ❌ Short Description: Missing');
    }

    if (fp.review_sentiment) {
      report.extractedToDb.review_sentiment++;
      console.log('   ✅ Review Sentiment: Present');
    } else {
      console.log('   ❌ Review Sentiment: Missing');
    }

    if (fp.hero_image) {
      report.extractedToDb.hero_image++;
      console.log('   ✅ Hero Image: Present');
    } else {
      console.log('   ❌ Hero Image: Missing');
    }

    const hasSocial = fp.instagram || fp.facebook || fp.tiktok;
    if (hasSocial) {
      report.extractedToDb.social_media++;
      const platforms = [
        fp.instagram ? 'Instagram' : null,
        fp.facebook ? 'Facebook' : null,
        fp.tiktok ? 'TikTok' : null
      ].filter(Boolean);
      console.log('   ✅ Social Media:', platforms.join(', '));
    } else {
      console.log('   ❌ Social Media: Missing');
    }

    // Identify gaps
    const gaps = [];
    if (fp.apify_output?.openingHours && !fp.opening_hours) {
      gaps.push('Opening hours in Apify but not extracted');
    }
    if (fp.apify_output?.description && !fp.description) {
      gaps.push('Description in Apify but not extracted');
    }
    if (!fp.description && !fp.short_description) {
      gaps.push('No AI-generated descriptions');
    }
    if (!fp.review_sentiment) {
      gaps.push('No review sentiment analysis');
    }
    if (!fp.instagram && !fp.facebook) {
      gaps.push('No social media found');
    }

    if (gaps.length > 0) {
      console.log('\n⚠️  DATA GAPS:');
      gaps.forEach(gap => console.log('   -', gap));
      report.dataGaps.push({ name: fp.name, gaps });
    }
  });

  // Summary Report
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));

  console.log('\n🔍 RAW DATA AVAILABILITY:');
  console.log(`   Apify Data:          ${report.hasApifyData}/${report.totalAnalyzed}`);
  console.log(`   Firecrawl Data:      ${report.hasFirecrawlData}/${report.totalAnalyzed}`);
  console.log(`   Opening Hours (Raw): ${report.hasOpeningHoursInApify}/${report.totalAnalyzed}`);
  console.log(`   Description (Raw):   ${report.hasDescriptionInApify}/${report.totalAnalyzed}`);
  console.log(`   Images (Raw):        ${report.hasImagesInApify}/${report.totalAnalyzed}`);
  console.log(`   Additional Info:     ${report.hasAdditionalInfo}/${report.totalAnalyzed}`);

  console.log('\n✅ EXTRACTED TO DATABASE:');
  console.log(`   Opening Hours:       ${report.extractedToDb.opening_hours}/${report.totalAnalyzed}`);
  console.log(`   Description:         ${report.extractedToDb.description}/${report.totalAnalyzed}`);
  console.log(`   Short Description:   ${report.extractedToDb.short_description}/${report.totalAnalyzed}`);
  console.log(`   Review Sentiment:    ${report.extractedToDb.review_sentiment}/${report.totalAnalyzed}`);
  console.log(`   Hero Image:          ${report.extractedToDb.hero_image}/${report.totalAnalyzed}`);
  console.log(`   Social Media:        ${report.extractedToDb.social_media}/${report.totalAnalyzed}`);

  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (report.extractedToDb.description === 0 && report.extractedToDb.review_sentiment === 0) {
    console.log('   ❌ CRITICAL: No AI-generated content');
    console.log('      → Need to run AI Enhancement step (OpenAI GPT-4o)');
  }

  if (report.hasOpeningHoursInApify > report.extractedToDb.opening_hours) {
    console.log('   ⚠️  Opening hours exist but not fully extracted');
    console.log('      → Check opening hours parser in data mapper');
  }

  if (report.extractedToDb.social_media === 0) {
    console.log('   ⚠️  No social media links found');
    console.log('      → Need to run Social Media Search step');
  }

  if (report.hasFirecrawlData === 0) {
    console.log('   ⚠️  No Firecrawl data');
    console.log('      → Need to run Website Scraping + Social Search');
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Run full extraction on TOP gyms (high ratings)');
  console.log('   2. Focus on AI Enhancement for descriptions & SEO');
  console.log('   3. Social media search for Instagram/Facebook');
  console.log('   4. Image extraction for photo galleries');
  console.log('');
}

diagnoseFitnessData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });































