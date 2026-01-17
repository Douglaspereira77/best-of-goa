#!/usr/bin/env node

/**
 * Verify Hotel Extraction Results
 * Checks what fields were populated for recently extracted hotels
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyExtraction() {
  console.log('🏨 VERIFY HOTEL EXTRACTION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get the two test hotels
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .in('id', [
      'af8a7590-b3c7-46d5-b826-a52fdc1ece2d',
      'ba876a9a-0b8b-44f6-88ab-0e3fe246937a'
    ]);

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!hotels || hotels.length === 0) {
    console.error('❌ No hotels found with those IDs');
    process.exit(1);
  }

  console.log(`📊 Found ${hotels.length} hotels\n`);

  for (const hotel of hotels) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🏨 ${hotel.name}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Basic Info
    console.log('📋 BASIC INFO');
    console.log(`   Name: ${hotel.name || '❌ Missing'}`);
    console.log(`   Slug: ${hotel.slug || '❌ Missing'}`);
    console.log(`   Area: ${hotel.area || '❌ Missing'}`);
    console.log(`   Address: ${hotel.address || '❌ Missing'}`);
    console.log(`   Status: ${hotel.extraction_status || '❌ Missing'}\n`);

    // Ratings
    console.log('⭐ RATINGS');
    console.log(`   Google Rating: ${hotel.google_rating || '❌ Missing'}`);
    console.log(`   Google Reviews: ${hotel.google_review_count || '❌ Missing'}`);
    console.log(`   Star Rating: ${hotel.star_rating || '❌ Missing'}`);
    console.log(`   Price Range: ${hotel.price_range || '❌ Missing'}\n`);

    // Contact Info
    console.log('📞 CONTACT');
    console.log(`   Phone: ${hotel.phone || '❌ Missing'}`);
    console.log(`   Email: ${hotel.email || '❌ Missing'}`);
    console.log(`   Website: ${hotel.website || '❌ Missing'}\n`);

    // Social Media
    console.log('📱 SOCIAL MEDIA');
    console.log(`   Instagram: ${hotel.instagram || '❌ Not found'}`);
    console.log(`   Facebook: ${hotel.facebook || '❌ Not found'}`);
    console.log(`   TikTok: ${hotel.tiktok || '❌ Not found'}`);
    console.log(`   Twitter: ${hotel.twitter || '❌ Not found'}`);
    console.log(`   YouTube: ${hotel.youtube || '❌ Not found'}`);
    console.log(`   LinkedIn: ${hotel.linkedin || '❌ Not found'}\n`);

    // AI Generated Content
    console.log('🤖 AI CONTENT');
    console.log(`   Description: ${hotel.description ? `✅ ${hotel.description.substring(0, 100)}...` : '❌ Missing'}`);
    console.log(`   Short Desc: ${hotel.short_description ? `✅ ${hotel.short_description.substring(0, 80)}...` : '❌ Missing'}`);
    console.log(`   Sentiment: ${hotel.review_sentiment ? `✅ ${hotel.review_sentiment.substring(0, 80)}...` : '❌ Missing'}\n`);

    // SEO
    console.log('🔍 SEO METADATA');
    console.log(`   Meta Title: ${hotel.meta_title || '❌ Missing'}`);
    console.log(`   Meta Desc: ${hotel.meta_description ? `✅ ${hotel.meta_description.substring(0, 60)}...` : '❌ Missing'}\n`);

    // Images
    console.log('🖼️ IMAGES');
    console.log(`   Hero Image: ${hotel.hero_image ? '✅ Set' : '❌ Missing'}`);
    if (hotel.hero_image) {
      console.log(`      URL: ${hotel.hero_image.substring(0, 80)}...`);
    }

    // Hotel Details
    console.log('\n🏢 HOTEL DETAILS');
    console.log(`   Check-in: ${hotel.check_in_time || '❌ Missing'}`);
    console.log(`   Check-out: ${hotel.check_out_time || '❌ Missing'}`);
    console.log(`   Total Rooms: ${hotel.total_rooms || '❌ Missing'}`);
    console.log(`   Pets Allowed: ${hotel.pets_allowed !== null ? hotel.pets_allowed : '❌ Missing'}`);
    console.log(`   Smoking Policy: ${hotel.smoking_policy || '❌ Missing'}\n`);

    // Categories & Amenities
    console.log('🏷️ CATEGORIES & AMENITIES');
    console.log(`   Category IDs: ${hotel.hotel_category_ids?.length > 0 ? hotel.hotel_category_ids.join(', ') : '❌ None'}`);
    console.log(`   Amenity IDs: ${hotel.hotel_amenity_ids?.length > 0 ? `${hotel.hotel_amenity_ids.length} amenities` : '❌ None'}`);
    console.log(`   Facility IDs: ${hotel.hotel_facility_ids?.length > 0 ? `${hotel.hotel_facility_ids.length} facilities` : '❌ None'}\n`);

    // Raw Data Check
    console.log('📦 RAW DATA STORAGE');
    console.log(`   Apify Output: ${hotel.apify_output ? '✅ Stored' : '❌ Missing'}`);
    console.log(`   Firecrawl Output: ${hotel.firecrawl_output ? '✅ Stored' : '❌ Missing'}`);

    if (hotel.firecrawl_output?.social_media_search) {
      console.log(`   Social Media Search: ✅ Stored`);
      const sms = hotel.firecrawl_output.social_media_search;
      if (sms.instagram) console.log(`      Instagram: ${sms.instagram.found ? `✅ Found (${sms.instagram.source})` : '❌ Not found'}`);
      if (sms.facebook) console.log(`      Facebook: ${sms.facebook.found ? `✅ Found (${sms.facebook.source})` : '❌ Not found'}`);
    }

    // Extraction Progress
    console.log('\n📈 EXTRACTION PROGRESS');
    if (hotel.extraction_progress) {
      const progress = hotel.extraction_progress;
      Object.keys(progress).forEach(step => {
        const status = progress[step];
        const icon = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏳';
        console.log(`   ${icon} ${step}: ${status}`);
      });
    } else {
      console.log('   ❌ No progress data');
    }

    console.log('\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 EXTRACTION SUMMARY\n');

  const completedCount = hotels.filter(h => h.extraction_status === 'completed').length;
  const withDescription = hotels.filter(h => h.description).length;
  const withImages = hotels.filter(h => h.hero_image).length;
  const withSocial = hotels.filter(h => h.instagram || h.facebook).length;
  const withSentiment = hotels.filter(h => h.review_sentiment).length;

  console.log(`   ✅ Completed extractions: ${completedCount}/${hotels.length}`);
  console.log(`   ✅ With AI descriptions: ${withDescription}/${hotels.length}`);
  console.log(`   ✅ With hero images: ${withImages}/${hotels.length}`);
  console.log(`   ✅ With social media: ${withSocial}/${hotels.length}`);
  console.log(`   ✅ With review sentiment: ${withSentiment}/${hotels.length}\n`);

  if (completedCount === hotels.length) {
    console.log('🎉 All extractions completed successfully!\n');
    console.log('🚀 Ready for full bulk extraction:');
    console.log('   node bin/extract-hotels-from-discovery.js\n');
  } else {
    console.log('⚠️  Some extractions may have issues. Check the progress above.\n');
  }
}

verifyExtraction().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
