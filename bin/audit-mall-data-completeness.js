#!/usr/bin/env node
/**
 * Audit Mall Data Completeness
 *
 * Checks what data is available in Apify/Firecrawl JSON vs what's populated in DB
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditMallData() {
  console.log('🔍 Mall Data Completeness Audit');
  console.log('='.repeat(80));

  // Get The Avenues Mall (our reference) or any completed mall with data
  const { data: malls } = await supabase
    .from('malls')
    .select('*')
    .or('name.ilike.%avenues%,extraction_status.eq.completed')
    .limit(2);

  if (!malls || malls.length === 0) {
    console.log('No malls found for audit');
    return;
  }

  for (const mall of malls) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 MALL: ${mall.name}`);
    console.log(`   Slug: ${mall.slug}`);
    console.log(`   Status: ${mall.extraction_status}`);
    console.log(`${'='.repeat(80)}`);

    // 1. Check core content fields
    console.log('\n📝 CORE CONTENT FIELDS:');
    const contentFields = {
      description: mall.description,
      short_description: mall.short_description,
      meta_title: mall.meta_title,
      meta_description: mall.meta_description,
      meta_keywords: mall.meta_keywords,
      review_sentiment: mall.review_sentiment,
    };

    for (const [field, value] of Object.entries(contentFields)) {
      if (value) {
        const preview = typeof value === 'string'
          ? value.substring(0, 80) + (value.length > 80 ? '...' : '')
          : JSON.stringify(value).substring(0, 80);
        console.log(`   ✅ ${field}: ${preview}`);
      } else {
        console.log(`   ❌ ${field}: MISSING`);
      }
    }

    // 2. Check location fields
    console.log('\n📍 LOCATION FIELDS:');
    const locationFields = {
      address: mall.address,
      area: mall.area,
      latitude: mall.latitude,
      longitude: mall.longitude,
      google_place_id: mall.google_place_id,
    };

    for (const [field, value] of Object.entries(locationFields)) {
      if (value) {
        console.log(`   ✅ ${field}: ${value}`);
      } else {
        console.log(`   ❌ ${field}: MISSING`);
      }
    }

    // 3. Check contact fields
    console.log('\n📞 CONTACT FIELDS:');
    const contactFields = {
      phone: mall.phone,
      email: mall.email,
      website: mall.website,
      instagram: mall.instagram,
      facebook: mall.facebook,
      twitter: mall.twitter,
      tiktok: mall.tiktok,
      youtube: mall.youtube,
      snapchat: mall.snapchat,
    };

    for (const [field, value] of Object.entries(contactFields)) {
      if (value) {
        console.log(`   ✅ ${field}: ${value}`);
      } else {
        console.log(`   ⚪ ${field}: not found`);
      }
    }

    // 4. Check mall-specific fields
    console.log('\n🏪 MALL-SPECIFIC FIELDS:');
    const mallFields = {
      total_stores: mall.total_stores,
      total_floors: mall.total_floors,
      total_parking_spaces: mall.total_parking_spaces,
      opening_hours: mall.opening_hours,
      amenities: mall.amenities,
      stores: mall.stores,
      google_rating: mall.google_rating,
      google_review_count: mall.google_review_count,
    };

    for (const [field, value] of Object.entries(mallFields)) {
      if (value) {
        const preview = typeof value === 'object'
          ? JSON.stringify(value).substring(0, 100) + '...'
          : value;
        console.log(`   ✅ ${field}: ${preview}`);
      } else {
        console.log(`   ❌ ${field}: MISSING`);
      }
    }

    // 5. Check images
    const { data: images } = await supabase
      .from('mall_images')
      .select('*')
      .eq('mall_id', mall.id);

    console.log('\n🖼️ IMAGES:');
    console.log(`   Total images: ${images?.length || 0}`);
    console.log(`   Hero image in malls table: ${mall.hero_image ? '✅' : '❌'}`);

    if (images && images.length > 0) {
      const heroImg = images.find(i => i.is_hero);
      console.log(`   Hero image in mall_images: ${heroImg ? '✅' : '❌'}`);
      console.log(`   Sample URLs:`);
      images.slice(0, 3).forEach((img, i) => {
        console.log(`     ${i+1}. ${img.url}`);
      });
    }

    // 6. Check FAQs
    const { data: faqs } = await supabase
      .from('mall_faqs')
      .select('*')
      .eq('mall_id', mall.id);

    console.log('\n❓ FAQs:');
    console.log(`   Total FAQs: ${faqs?.length || 0}`);
    if (faqs && faqs.length > 0) {
      faqs.slice(0, 2).forEach((faq, i) => {
        console.log(`   ${i+1}. Q: ${faq.question.substring(0, 60)}...`);
      });
    }

    // 7. Analyze raw Apify data
    console.log('\n📦 RAW APIFY DATA ANALYSIS:');
    const apifyData = mall.apify_output || {};

    if (Object.keys(apifyData).length === 0) {
      console.log('   ❌ No Apify data stored');
    } else {
      console.log(`   Total fields: ${Object.keys(apifyData).length}`);
      console.log(`   Available keys: ${Object.keys(apifyData).join(', ')}`);

      // Check what's in Apify but NOT mapped to DB
      const apifyAvailableFields = {
        'name/title': apifyData.name || apifyData.title,
        'address': apifyData.address || apifyData.formatted_address,
        'phone': apifyData.phone || apifyData.internationalPhoneNumber,
        'website': apifyData.website,
        'rating/totalScore': apifyData.rating || apifyData.totalScore,
        'reviewsCount': apifyData.user_ratings_total || apifyData.reviewsCount,
        'openingHours': apifyData.openingHours || apifyData.opening_hours,
        'imageUrls': apifyData.imageUrls?.length || 0,
        'categories': apifyData.categories || apifyData.types,
        'reviews': apifyData.reviews?.length || 0,
      };

      console.log('\n   Apify fields available vs mapped:');
      for (const [field, value] of Object.entries(apifyAvailableFields)) {
        if (value) {
          const preview = typeof value === 'object'
            ? JSON.stringify(value).substring(0, 60) + '...'
            : String(value).substring(0, 60);
          console.log(`     📊 ${field}: ${preview}`);
        }
      }

      // Check for opening hours specifically
      if (apifyData.openingHours) {
        console.log('\n   📅 Opening Hours in Apify:');
        console.log(`      Type: ${typeof apifyData.openingHours}`);
        if (Array.isArray(apifyData.openingHours)) {
          apifyData.openingHours.slice(0, 3).forEach(h => {
            console.log(`      - ${JSON.stringify(h)}`);
          });
        } else if (typeof apifyData.openingHours === 'object') {
          console.log(`      ${JSON.stringify(apifyData.openingHours, null, 2).substring(0, 200)}`);
        }
      }
    }

    // 8. Analyze raw Firecrawl data
    console.log('\n📦 RAW FIRECRAWL DATA ANALYSIS:');
    const firecrawlData = mall.firecrawl_output || {};

    if (Object.keys(firecrawlData).length === 0) {
      console.log('   ❌ No Firecrawl data stored');
    } else {
      console.log(`   Total keys: ${Object.keys(firecrawlData).length}`);
      for (const key of Object.keys(firecrawlData)) {
        const data = firecrawlData[key];
        if (Array.isArray(data)) {
          console.log(`   ${key}: ${data.length} results`);
        } else if (typeof data === 'object') {
          console.log(`   ${key}: ${Object.keys(data).length} fields`);
        } else {
          console.log(`   ${key}: ${String(data).substring(0, 50)}`);
        }
      }

      // Check social media search results
      if (firecrawlData.social_media_search) {
        console.log('\n   🔗 Social Media Search Results:');
        const social = firecrawlData.social_media_search;
        for (const platform of ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat']) {
          if (social[platform]) {
            console.log(`      ${platform}: ${social[platform].url || 'found but no URL'} (confidence: ${social[platform].confidence || 'N/A'})`);
          }
        }
      }
    }

    // 9. GAPS ANALYSIS
    console.log('\n⚠️ DATA GAPS TO FIX:');
    const gaps = [];

    if (!mall.opening_hours && apifyData.openingHours) {
      gaps.push('opening_hours: Available in Apify but not mapped to DB');
    }
    if (!mall.total_stores && mall.stores?.length > 0) {
      gaps.push('total_stores: Should be calculated from stores array');
    }
    if (!mall.amenities || mall.amenities.length === 0) {
      gaps.push('amenities: Not populated from data');
    }
    if (!mall.description) {
      gaps.push('description: AI enhancement did not run or failed');
    }
    if ((images?.length || 0) === 0 && apifyData.imageUrls?.length > 0) {
      gaps.push('images: Available in Apify but not extracted');
    }

    if (gaps.length > 0) {
      gaps.forEach(gap => console.log(`   🔴 ${gap}`));
    } else {
      console.log('   ✅ No major gaps detected');
    }
  }
}

auditMallData().catch(console.error);
