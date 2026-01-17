#!/usr/bin/env node

/**
 * BOK Content Tester - The Avenues Mall Data Validation
 * Validates data extraction completeness and mapping accuracy
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateAvenuesData() {
  console.log('='.repeat(80));
  console.log('BOK CONTENT TESTER - THE AVENUES MALL DATA VALIDATION');
  console.log('='.repeat(80));
  console.log('Testing Date:', new Date().toISOString());
  console.log('');

  // Fetch The Avenues data
  const { data: mall, error } = await supabase
    .from('malls')
    .select('*')
    .ilike('name', '%avenues%')
    .single();

  if (error) {
    console.error('ERROR: Failed to fetch The Avenues data:', error.message);
    return;
  }

  if (!mall) {
    console.error('ERROR: The Avenues mall not found in database');
    return;
  }

  console.log('Mall Found:', mall.name);
  console.log('ID:', mall.id);
  console.log('Slug:', mall.slug);
  console.log('');

  // Parse raw extraction outputs
  const apifyData = mall.apify_output || {};
  const firecrawlData = mall.firecrawl_output || {};

  console.log('='.repeat(80));
  console.log('1. RAW EXTRACTION DATA AVAILABLE');
  console.log('='.repeat(80));

  console.log('\nAPIF OUTPUT KEYS:', Object.keys(apifyData).join(', ') || 'EMPTY');
  console.log('FIRECRAWL OUTPUT KEYS:', Object.keys(firecrawlData).join(', ') || 'EMPTY');
  console.log('');

  // Define all expected fields based on schema
  const fieldGroups = {
    'Basic Info': {
      name: { value: mall.name, apify: apifyData.title || apifyData.name, firecrawl: firecrawlData.name },
      name_ar: { value: mall.name_ar, apify: null, firecrawl: firecrawlData.name_ar },
      slug: { value: mall.slug, apify: null, firecrawl: null },
      google_place_id: { value: mall.google_place_id, apify: apifyData.placeId, firecrawl: null },
    },
    'Location': {
      address: { value: mall.address, apify: apifyData.address, firecrawl: firecrawlData.address },
      area: { value: mall.area, apify: null, firecrawl: firecrawlData.area },
      latitude: { value: mall.latitude, apify: apifyData.location?.lat, firecrawl: null },
      longitude: { value: mall.longitude, apify: apifyData.location?.lng, firecrawl: null },
      neighborhood_id: { value: mall.neighborhood_id, apify: null, firecrawl: null },
    },
    'Contact': {
      phone: { value: mall.phone, apify: apifyData.phone, firecrawl: firecrawlData.phone },
      email: { value: mall.email, apify: null, firecrawl: firecrawlData.email },
      website: { value: mall.website, apify: apifyData.website, firecrawl: firecrawlData.website },
    },
    'Social Media': {
      instagram: { value: mall.instagram, apify: null, firecrawl: firecrawlData.instagram },
      facebook: { value: mall.facebook, apify: null, firecrawl: firecrawlData.facebook },
      twitter: { value: mall.twitter, apify: null, firecrawl: firecrawlData.twitter },
      tiktok: { value: mall.tiktok, apify: null, firecrawl: firecrawlData.tiktok },
      youtube: { value: mall.youtube, apify: null, firecrawl: firecrawlData.youtube },
      snapchat: { value: mall.snapchat, apify: null, firecrawl: firecrawlData.snapchat },
      whatsapp: { value: mall.whatsapp, apify: null, firecrawl: firecrawlData.whatsapp },
    },
    'Mall-Specific': {
      total_stores: { value: mall.total_stores, apify: null, firecrawl: firecrawlData.total_stores },
      total_floors: { value: mall.total_floors, apify: null, firecrawl: firecrawlData.total_floors },
      total_parking_spaces: { value: mall.total_parking_spaces, apify: null, firecrawl: firecrawlData.total_parking_spaces },
      gross_leasable_area_sqm: { value: mall.gross_leasable_area_sqm, apify: null, firecrawl: firecrawlData.gross_leasable_area_sqm },
      year_opened: { value: mall.year_opened, apify: null, firecrawl: firecrawlData.year_opened },
      year_renovated: { value: mall.year_renovated, apify: null, firecrawl: firecrawlData.year_renovated },
      mall_type: { value: mall.mall_type, apify: null, firecrawl: firecrawlData.mall_type },
    },
    'Operating Hours': {
      weekday_open_time: { value: mall.weekday_open_time, apify: apifyData.openingHours, firecrawl: firecrawlData.weekday_open_time },
      weekday_close_time: { value: mall.weekday_close_time, apify: apifyData.openingHours, firecrawl: firecrawlData.weekday_close_time },
      weekend_open_time: { value: mall.weekend_open_time, apify: apifyData.openingHours, firecrawl: firecrawlData.weekend_open_time },
      weekend_close_time: { value: mall.weekend_close_time, apify: apifyData.openingHours, firecrawl: firecrawlData.weekend_close_time },
      friday_open_time: { value: mall.friday_open_time, apify: apifyData.openingHours, firecrawl: firecrawlData.friday_open_time },
      friday_close_time: { value: mall.friday_close_time, apify: apifyData.openingHours, firecrawl: firecrawlData.friday_close_time },
      ramadan_hours: { value: mall.ramadan_hours, apify: null, firecrawl: firecrawlData.ramadan_hours },
    },
    'Parking': {
      parking_type: { value: mall.parking_type, apify: null, firecrawl: firecrawlData.parking_type },
      valet_parking: { value: mall.valet_parking, apify: null, firecrawl: firecrawlData.valet_parking },
      parking_fee: { value: mall.parking_fee, apify: null, firecrawl: firecrawlData.parking_fee },
      ev_charging_stations: { value: mall.ev_charging_stations, apify: null, firecrawl: firecrawlData.ev_charging_stations },
    },
    'Ratings': {
      google_rating: { value: mall.google_rating, apify: apifyData.totalScore || apifyData.rating, firecrawl: null },
      google_review_count: { value: mall.google_review_count, apify: apifyData.reviewsCount, firecrawl: null },
      bok_score: { value: mall.bok_score, apify: null, firecrawl: null },
    },
    'Content': {
      description: { value: mall.description, apify: apifyData.description, firecrawl: firecrawlData.description },
      short_description: { value: mall.short_description, apify: null, firecrawl: firecrawlData.short_description },
      review_sentiment: { value: mall.review_sentiment, apify: null, firecrawl: null },
    },
    'SEO': {
      meta_title: { value: mall.meta_title, apify: null, firecrawl: null },
      meta_description: { value: mall.meta_description, apify: null, firecrawl: null },
      meta_keywords: { value: mall.meta_keywords, apify: null, firecrawl: null },
      og_title: { value: mall.og_title, apify: null, firecrawl: null },
      og_description: { value: mall.og_description, apify: null, firecrawl: null },
      og_image: { value: mall.og_image, apify: null, firecrawl: null },
    },
    'Images': {
      hero_image: { value: mall.hero_image, apify: apifyData.imageUrl || apifyData.mainPhoto, firecrawl: firecrawlData.hero_image },
      logo_image: { value: mall.logo_image, apify: null, firecrawl: firecrawlData.logo_image },
    },
    'Features & Categories': {
      special_features: { value: mall.special_features, apify: apifyData.additionalInfo, firecrawl: firecrawlData.special_features },
      mall_category_ids: { value: mall.mall_category_ids, apify: null, firecrawl: null },
      mall_amenity_ids: { value: mall.mall_amenity_ids, apify: null, firecrawl: firecrawlData.amenities },
      mall_anchor_store_ids: { value: mall.mall_anchor_store_ids, apify: null, firecrawl: firecrawlData.anchor_stores },
    },
    'Status': {
      extraction_status: { value: mall.extraction_status, apify: null, firecrawl: null },
      verified: { value: mall.verified, apify: null, firecrawl: null },
      featured: { value: mall.featured, apify: null, firecrawl: null },
      active: { value: mall.active, apify: null, firecrawl: null },
    },
  };

  // Analysis
  const passedChecks = [];
  const warnings = [];
  const criticalIssues = [];
  const unmappedData = [];

  console.log('='.repeat(80));
  console.log('2. FIELD-BY-FIELD VALIDATION');
  console.log('='.repeat(80));

  for (const [groupName, fields] of Object.entries(fieldGroups)) {
    console.log(`\n--- ${groupName} ---`);

    for (const [fieldName, data] of Object.entries(fields)) {
      const hasValue = data.value !== null && data.value !== undefined && data.value !== '';
      const hasApifyData = data.apify !== null && data.apify !== undefined;
      const hasFirecrawlData = data.firecrawl !== null && data.firecrawl !== undefined;

      let status = '';
      let displayValue = '';

      if (hasValue) {
        if (Array.isArray(data.value)) {
          displayValue = `[${data.value.length} items]`;
        } else if (typeof data.value === 'object') {
          displayValue = JSON.stringify(data.value).substring(0, 50) + '...';
        } else {
          displayValue = String(data.value).substring(0, 50);
        }
        status = 'POPULATED';
        passedChecks.push(`${fieldName}: ${displayValue}`);
      } else {
        displayValue = 'NULL';
        status = 'EMPTY';

        // Check if data is available but not mapped
        if (hasApifyData || hasFirecrawlData) {
          status = 'MISSING DATA';
          const availableSources = [];
          if (hasApifyData) availableSources.push(`Apify: ${JSON.stringify(data.apify).substring(0, 100)}`);
          if (hasFirecrawlData) availableSources.push(`Firecrawl: ${JSON.stringify(data.firecrawl).substring(0, 100)}`);

          criticalIssues.push(`${fieldName}: Data available in ${availableSources.join(' | ')} but NOT mapped to table`);
          unmappedData.push({ field: fieldName, apify: data.apify, firecrawl: data.firecrawl });
        } else {
          // Missing from all sources
          if (fieldName === 'description' || fieldName === 'google_rating' || fieldName === 'hero_image') {
            warnings.push(`${fieldName}: Critical field is empty and no source data available`);
          }
        }
      }

      console.log(`  ${fieldName}: ${status} - ${displayValue}`);

      // Check for mismatches
      if (hasValue && (hasApifyData || hasFirecrawlData)) {
        // Verify consistency
        if (hasApifyData && String(data.value) !== String(data.apify) && !['openingHours', 'location'].includes(typeof data.apify === 'object' ? 'object' : '')) {
          // This is expected for some fields, but flag obvious mismatches
        }
      }
    }
  }

  // Check raw data for additional fields not in schema
  console.log('\n' + '='.repeat(80));
  console.log('3. UNMAPPED RAW DATA CHECK');
  console.log('='.repeat(80));

  console.log('\nAPify Output (Full Structure):');
  if (Object.keys(apifyData).length > 0) {
    console.log(JSON.stringify(apifyData, null, 2));
  } else {
    console.log('  EMPTY - No Apify data extracted');
    criticalIssues.push('No Apify/Google Places data extracted - missing critical source');
  }

  console.log('\nFirecrawl Output (Full Structure):');
  if (Object.keys(firecrawlData).length > 0) {
    console.log(JSON.stringify(firecrawlData, null, 2));
  } else {
    console.log('  EMPTY - No Firecrawl data extracted');
    criticalIssues.push('No Firecrawl/website scrape data extracted - missing critical source');
  }

  // Calculate quality scores
  console.log('\n' + '='.repeat(80));
  console.log('4. QUALITY SCORES');
  console.log('='.repeat(80));

  const totalFields = Object.values(fieldGroups).reduce((acc, group) => acc + Object.keys(group).length, 0);
  const populatedFields = passedChecks.length;
  const accuracyScore = Math.round((populatedFields / totalFields) * 100);

  // SEO score - check if SEO fields are populated
  const seoFields = ['meta_title', 'meta_description', 'og_title', 'og_description'];
  const populatedSeoFields = seoFields.filter(f => mall[f]).length;
  const seoScore = Math.round((populatedSeoFields / seoFields.length) * 100);

  // Cultural appropriateness - check for inappropriate content (basic check)
  let culturalScore = 100;
  const inappropriateTerms = ['alcohol', 'pork', 'bar', 'nightclub'];
  const contentToCheck = [mall.description, mall.short_description].join(' ').toLowerCase();
  inappropriateTerms.forEach(term => {
    if (contentToCheck.includes(term)) {
      culturalScore -= 20;
      warnings.push(`Content may contain culturally sensitive term: "${term}"`);
    }
  });

  // Brand consistency
  const brandScore = mall.description ? (mall.description.length > 100 ? 70 : 40) : 0;

  // User engagement score - based on content richness
  const engagementFields = ['description', 'hero_image', 'special_features', 'google_rating'];
  const populatedEngagementFields = engagementFields.filter(f => mall[f] && (Array.isArray(mall[f]) ? mall[f].length > 0 : true)).length;
  const engagementScore = Math.round((populatedEngagementFields / engagementFields.length) * 100);

  const overallScore = Math.round((accuracyScore + seoScore + culturalScore + brandScore + engagementScore) / 5);

  console.log(`\n  Accuracy (Field Population): ${accuracyScore}/100`);
  console.log(`  SEO Optimization: ${seoScore}/100`);
  console.log(`  Cultural Appropriateness: ${culturalScore}/100`);
  console.log(`  Brand Consistency: ${brandScore}/100`);
  console.log(`  User Engagement: ${engagementScore}/100`);
  console.log(`  OVERALL QUALITY: ${overallScore}/100`);

  // Final report
  console.log('\n' + '='.repeat(80));
  console.log('5. FINAL TESTING REPORT');
  console.log('='.repeat(80));

  console.log('\nPASSED CHECKS:', passedChecks.length);
  passedChecks.forEach(check => console.log(`  [OK] ${check}`));

  console.log('\nWARNINGS:', warnings.length);
  warnings.forEach(warning => console.log(`  [WARN] ${warning}`));

  console.log('\nCRITICAL ISSUES:', criticalIssues.length);
  criticalIssues.forEach(issue => console.log(`  [CRITICAL] ${issue}`));

  console.log('\nUNMAPPED DATA:', unmappedData.length);
  unmappedData.forEach(item => {
    console.log(`  - ${item.field}:`);
    if (item.apify) console.log(`      Apify: ${JSON.stringify(item.apify).substring(0, 200)}`);
    if (item.firecrawl) console.log(`      Firecrawl: ${JSON.stringify(item.firecrawl).substring(0, 200)}`);
  });

  // Status determination
  let status = 'APPROVED';
  if (criticalIssues.length > 0) {
    status = 'NEEDS REVISION';
  }
  if (criticalIssues.length > 5 || overallScore < 30) {
    status = 'REJECTED';
  }

  console.log('\n' + '='.repeat(80));
  console.log(`STATUS: ${status}`);
  console.log('='.repeat(80));

  console.log('\nRECOMMENDATIONS FOR BOK DOCTOR:');
  if (criticalIssues.length > 0) {
    console.log('1. Fix data mapping from raw extraction outputs to table fields');
  }
  if (seoScore < 50) {
    console.log('2. Generate SEO metadata (meta_title, meta_description, og_title, og_description)');
  }
  if (!mall.google_rating) {
    console.log('3. Re-run Google Places extraction to populate ratings data');
  }
  if (!mall.hero_image) {
    console.log('4. Extract and set hero image from available sources');
  }
  if (mall.mall_amenity_ids?.length === 0) {
    console.log('5. Map extracted amenities to mall_amenity_ids');
  }
  if (!mall.description || mall.description.length < 200) {
    console.log('6. Generate AI-enhanced description with more detail');
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF VALIDATION REPORT');
  console.log('='.repeat(80));
}

validateAvenuesData().catch(console.error);