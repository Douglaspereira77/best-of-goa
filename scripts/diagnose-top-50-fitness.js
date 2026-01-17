/**
 * Diagnostic: Check Top 50 Fitness Places Data Status
 * 
 * Analyzes which places have complete data vs need extraction
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseTop50() {
  console.log('🔍 Top 50 Fitness Places - Data Status Diagnostic');
  console.log('================================================\n');

  // Get top 50 fitness places by review count
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select(`
      id, 
      name, 
      slug, 
      area, 
      google_rating, 
      google_review_count,
      extraction_status,
      apify_output,
      firecrawl_output,
      description,
      short_description,
      meta_title,
      review_sentiment,
      bok_score,
      website
    `)
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .order('google_review_count', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error fetching fitness places:', error);
    process.exit(1);
  }

  console.log(`Found ${fitnessPlaces.length} fitness places\n`);

  // Check images
  const { data: imagesData } = await supabase
    .from('fitness_images')
    .select('fitness_place_id')
    .in('fitness_place_id', fitnessPlaces.map(fp => fp.id));

  const imagesByPlace = {};
  if (imagesData) {
    imagesData.forEach(img => {
      imagesByPlace[img.fitness_place_id] = (imagesByPlace[img.fitness_place_id] || 0) + 1;
    });
  }

  // Check FAQs
  const { data: faqsData } = await supabase
    .from('fitness_faqs')
    .select('fitness_place_id')
    .in('fitness_place_id', fitnessPlaces.map(fp => fp.id));

  const faqsByPlace = {};
  if (faqsData) {
    faqsData.forEach(faq => {
      faqsByPlace[faq.fitness_place_id] = (faqsByPlace[faq.fitness_place_id] || 0) + 1;
    });
  }

  // Analyze each place
  const analysis = {
    complete: [], // Has all critical data
    partial: [],  // Has some data but missing key fields
    missing: []   // Missing most/all data
  };

  fitnessPlaces.forEach(fp => {
    const hasApify = !!fp.apify_output;
    const hasFirecrawl = !!fp.firecrawl_output;
    const hasDescription = !!fp.description;
    const hasShortDesc = !!fp.short_description;
    const hasMetaTitle = !!fp.meta_title;
    const hasSentiment = !!fp.review_sentiment;
    const hasBOKScore = fp.bok_score !== null && fp.bok_score !== undefined;
    const imageCount = imagesByPlace[fp.id] || 0;
    const faqCount = faqsByPlace[fp.id] || 0;

    const status = {
      id: fp.id,
      name: fp.name,
      area: fp.area,
      extraction_status: fp.extraction_status,
      hasApify,
      hasFirecrawl,
      hasDescription,
      hasShortDesc,
      hasMetaTitle,
      hasSentiment,
      hasBOKScore,
      imageCount,
      faqCount,
      website: !!fp.website
    };

    // Categorize
    const criticalFields = [hasApify, hasFirecrawl, hasDescription, hasMetaTitle];
    const criticalCount = criticalFields.filter(Boolean).length;
    const hasImages = imageCount > 0;
    const hasFAQs = faqCount > 0;

    if (criticalCount === 4 && hasImages && hasBOKScore) {
      analysis.complete.push(status);
    } else if (criticalCount >= 2) {
      analysis.partial.push(status);
    } else {
      analysis.missing.push(status);
    }
  });

  // Print summary
  console.log('📊 DATA STATUS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Complete (all critical data): ${analysis.complete.length}`);
  console.log(`⚠️  Partial (some data missing): ${analysis.partial.length}`);
  console.log(`❌ Missing (needs full extraction): ${analysis.missing.length}`);
  console.log('');

  // Detailed breakdown
  console.log('📋 FIELD COVERAGE');
  console.log('='.repeat(60));
  const total = fitnessPlaces.length;
  const apifyCount = fitnessPlaces.filter(fp => fp.apify_output).length;
  const firecrawlCount = fitnessPlaces.filter(fp => fp.firecrawl_output).length;
  const descCount = fitnessPlaces.filter(fp => fp.description).length;
  const metaCount = fitnessPlaces.filter(fp => fp.meta_title).length;
  const sentimentCount = fitnessPlaces.filter(fp => fp.review_sentiment).length;
  const bokCount = fitnessPlaces.filter(fp => fp.bok_score !== null).length;
  const totalImages = Object.values(imagesByPlace).reduce((sum, count) => sum + count, 0);
  const totalFAQs = Object.values(faqsByPlace).reduce((sum, count) => sum + count, 0);

  console.log(`Apify Data:        ${apifyCount}/${total} (${Math.round(apifyCount/total*100)}%)`);
  console.log(`Firecrawl Data:    ${firecrawlCount}/${total} (${Math.round(firecrawlCount/total*100)}%)`);
  console.log(`Description:       ${descCount}/${total} (${Math.round(descCount/total*100)}%)`);
  console.log(`Meta Title:        ${metaCount}/${total} (${Math.round(metaCount/total*100)}%)`);
  console.log(`Review Sentiment:  ${sentimentCount}/${total} (${Math.round(sentimentCount/total*100)}%)`);
  console.log(`BOK Score:         ${bokCount}/${total} (${Math.round(bokCount/total*100)}%)`);
  console.log(`Images:            ${totalImages} total (avg ${Math.round(totalImages/total)} per place)`);
  console.log(`FAQs:              ${totalFAQs} total (avg ${Math.round(totalFAQs/total)} per place)`);
  console.log('');

  // Show places that need extraction
  if (analysis.missing.length > 0) {
    console.log('❌ PLACES NEEDING FULL EXTRACTION');
    console.log('='.repeat(60));
    analysis.missing.slice(0, 10).forEach((fp, i) => {
      console.log(`${i + 1}. ${fp.name} (${fp.area})`);
      console.log(`   Status: ${fp.extraction_status}`);
      console.log(`   Apify: ${fp.hasApify ? '✅' : '❌'} | Firecrawl: ${fp.hasFirecrawl ? '✅' : '❌'} | Desc: ${fp.hasDescription ? '✅' : '❌'}`);
    });
    if (analysis.missing.length > 10) {
      console.log(`   ... and ${analysis.missing.length - 10} more`);
    }
    console.log('');
  }

  // Show partial places
  if (analysis.partial.length > 0) {
    console.log('⚠️  PLACES WITH PARTIAL DATA');
    console.log('='.repeat(60));
    analysis.partial.slice(0, 5).forEach((fp, i) => {
      console.log(`${i + 1}. ${fp.name} (${fp.area})`);
      const missing = [];
      if (!fp.hasApify) missing.push('Apify');
      if (!fp.hasFirecrawl) missing.push('Firecrawl');
      if (!fp.hasDescription) missing.push('Description');
      if (!fp.hasMetaTitle) missing.push('Meta Title');
      if (fp.imageCount === 0) missing.push('Images');
      if (!fp.hasBOKScore) missing.push('BOK Score');
      console.log(`   Missing: ${missing.join(', ') || 'None (may need AI enhancement)'}`);
    });
    if (analysis.partial.length > 5) {
      console.log(`   ... and ${analysis.partial.length - 5} more`);
    }
    console.log('');
  }

  // Cost estimate
  console.log('💰 ESTIMATED COST (if running full extraction)');
  console.log('='.repeat(60));
  const placesToExtract = analysis.missing.length + analysis.partial.length;
  console.log(`Places needing extraction: ${placesToExtract}`);
  console.log(`Estimated API calls per place:`);
  console.log(`  - Apify (Google Places): ~$0.001 per call`);
  console.log(`  - Firecrawl (Website): ~$0.01 per call`);
  console.log(`  - Vision AI (Images): ~$0.01 per image (avg 10 images)`);
  console.log(`  - OpenAI GPT-4o (Enhancement): ~$0.10 per place`);
  console.log(`Total estimated cost: ~$${(placesToExtract * 0.22).toFixed(2)}`);
  console.log('');

  console.log('💡 RECOMMENDATION');
  console.log('='.repeat(60));
  if (analysis.complete.length === total) {
    console.log('✅ All places have complete data. No extraction needed.');
  } else if (analysis.missing.length > 0) {
    console.log(`⚠️  ${analysis.missing.length} places need full extraction.`);
    console.log(`   Consider running extraction for missing places only.`);
  } else {
    console.log(`⚠️  ${analysis.partial.length} places have partial data.`);
    console.log(`   May need AI enhancement or specific step re-runs.`);
  }
  console.log('');

  // Return analysis for use in extraction script
  return {
    placesToExtract: [...analysis.missing, ...analysis.partial].map(fp => fp.id),
    missingIds: analysis.missing.map(fp => fp.id),
    partialIds: analysis.partial.map(fp => fp.id)
  };
}

diagnoseTop50()
  .then((result) => {
    if (result) {
      console.log('📝 Extraction IDs prepared:', result.placesToExtract.length, 'places');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });































