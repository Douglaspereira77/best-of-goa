/**
 * School Image Extraction Diagnostic Script
 * 
 * Diagnoses why a school doesn't have images extracted
 * Usage: node bin/diagnose-school-images.js "London College of United Knowledge"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseSchoolImages(schoolName) {
  console.log(`\n🔍 Diagnosing image extraction for: "${schoolName}"\n`);
  console.log('=' .repeat(80));

  // Find the school
  const { data: schools, error: searchError } = await supabase
    .from('schools')
    .select('*')
    .or(`name.ilike.%${schoolName}%,slug.ilike.%${schoolName.toLowerCase().replace(/\s+/g, '-')}%`)
    .limit(5);

  if (searchError) {
    console.error('❌ Error searching for school:', searchError);
    return;
  }

  if (!schools || schools.length === 0) {
    console.error(`❌ No school found matching "${schoolName}"`);
    console.log('\n💡 Try searching with a partial name or slug');
    return;
  }

  if (schools.length > 1) {
    console.log(`⚠️  Found ${schools.length} schools matching the search:`);
    schools.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.slug})`);
    });
    console.log('\n📋 Analyzing the first match...\n');
  }

  const school = schools[0];
  console.log(`\n✅ Found: ${school.name}`);
  console.log(`   ID: ${school.id}`);
  console.log(`   Slug: ${school.slug}`);
  console.log(`   Active: ${school.active}`);
  console.log(`   Published: ${school.published || false}`);

  // Check 1: Google Place ID
  console.log('\n' + '='.repeat(80));
  console.log('CHECK 1: Google Place ID');
  console.log('='.repeat(80));
  if (!school.google_place_id) {
    console.log('❌ MISSING: google_place_id is NULL');
    console.log('   → Image extraction requires a Google Place ID');
    console.log('   → Fix: Re-run extraction from Step 1 (Apify fetch)');
  } else {
    console.log(`✅ PRESENT: ${school.google_place_id}`);
  }

  // Check 2: Extraction Status
  console.log('\n' + '='.repeat(80));
  console.log('CHECK 2: Extraction Status');
  console.log('='.repeat(80));
  console.log(`   Status: ${school.extraction_status || 'NULL'}`);
  
  if (school.extraction_status !== 'completed') {
    console.log(`❌ ISSUE: Extraction status is "${school.extraction_status}" (expected: "completed")`);
    if (school.extraction_status === 'failed') {
      console.log(`   Error: ${school.extraction_error || 'No error message'}`);
    }
    console.log('   → Fix: Re-run the extraction');
  } else {
    console.log('✅ Status is "completed"');
  }

  // Check 3: Extraction Progress
  console.log('\n' + '='.repeat(80));
  console.log('CHECK 3: Extraction Progress');
  console.log('='.repeat(80));
  const progress = school.extraction_progress || {};
  
  if (Object.keys(progress).length === 0) {
    console.log('❌ MISSING: extraction_progress is empty');
  } else {
    console.log('📋 Extraction Steps:');
    const steps = [
      'apify_fetch',
      'firecrawl_website',
      'social_media_search',
      'apify_reviews',
      'curriculum_detection',
      'tuition_extraction',
      'facilities_detection',
      'grade_level_mapping',
      'gender_policy_detection',
      'process_images', // This is the key one!
      'content_extraction',
      'ai_enhancement',
      'category_matching',
      'bok_score_calculation'
    ];

    steps.forEach(step => {
      const stepStatus = progress[step];
      if (stepStatus) {
        const status = stepStatus.status || stepStatus;
        const icon = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
        console.log(`   ${icon} ${step}: ${status}`);
        if (stepStatus.error) {
          console.log(`      Error: ${stepStatus.error}`);
        }
      } else {
        console.log(`   ⚪ ${step}: Not started`);
      }
    });

    // Specifically check image step
    const imageStep = progress.process_images;
    if (!imageStep) {
      console.log('\n❌ CRITICAL: process_images step not found in extraction_progress');
      console.log('   → This means Step 10 (image extraction) never ran');
    } else if (imageStep.status === 'failed') {
      console.log('\n❌ CRITICAL: process_images step FAILED');
      console.log(`   → Error: ${imageStep.error || 'Unknown error'}`);
    }
  }

  // Check 4: Apify Output (source of images)
  console.log('\n' + '='.repeat(80));
  console.log('CHECK 4: Apify Output (Google Places Data)');
  console.log('='.repeat(80));
  const apifyOutput = school.apify_output;
  
  if (!apifyOutput) {
    console.log('❌ MISSING: apify_output is NULL');
    console.log('   → No Google Places data available');
    console.log('   → Fix: Re-run Step 1 (Apify fetch)');
  } else {
    console.log('✅ Apify output exists');
    
    // Check for photos/images in Apify data
    const photos = apifyOutput.photos || apifyOutput.images || [];
    const imagesCount = apifyOutput.imagesCount || photos.length;
    
    if (imagesCount === 0 || photos.length === 0) {
      console.log(`⚠️  WARNING: No photos found in Apify output`);
      console.log(`   → Google Places may not have photos for this place`);
      console.log(`   → Check: https://www.google.com/maps/place/?q=place_id:${school.google_place_id}`);
    } else {
      console.log(`✅ Found ${imagesCount} photos in Apify output`);
      if (photos.length > 0) {
        console.log(`   First photo reference: ${photos[0].photo_reference || 'N/A'}`);
      }
    }
  }

  // Check 5: Current Image Fields
  console.log('\n' + '='.repeat(80));
  console.log('CHECK 5: Current Image Fields in Database');
  console.log('='.repeat(80));
  
  const hasHeroImage = !!school.hero_image;
  const hasPhotos = school.photos && Array.isArray(school.photos) && school.photos.length > 0;
  const hasGalleryImages = school.gallery_images && Array.isArray(school.gallery_images) && school.gallery_images.length > 0;

  console.log(`   hero_image: ${hasHeroImage ? `✅ ${school.hero_image}` : '❌ NULL'}`);
  console.log(`   photos: ${hasPhotos ? `✅ ${school.photos.length} images` : '❌ NULL or empty'}`);
  console.log(`   gallery_images: ${hasGalleryImages ? `✅ ${school.gallery_images.length} images` : '❌ NULL or empty'}`);

  // Check school_images table
  const { data: schoolImages, error: imagesError } = await supabase
    .from('school_images')
    .select('*')
    .eq('school_id', school.id)
    .eq('is_active', true);

  if (imagesError) {
    console.log(`   school_images table: ⚠️  Error querying (table may not exist): ${imagesError.message}`);
  } else {
    console.log(`   school_images table: ${schoolImages && schoolImages.length > 0 ? `✅ ${schoolImages.length} active images` : '❌ No active images'}`);
  }

  // Summary and Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('='.repeat(80));

  const issues = [];
  const recommendations = [];

  if (!school.google_place_id) {
    issues.push('Missing Google Place ID');
    recommendations.push('Re-run extraction from Step 1 (Apify fetch)');
  }

  if (school.extraction_status !== 'completed') {
    issues.push(`Extraction status: ${school.extraction_status}`);
    recommendations.push('Complete the extraction process');
  }

  const imageStep = progress.process_images;
  if (!imageStep || imageStep.status !== 'completed') {
    issues.push('Image extraction step not completed');
    if (school.google_place_id && school.extraction_status === 'completed') {
      recommendations.push('Manually trigger image extraction (Step 10)');
    }
  }

  if (apifyOutput && (!apifyOutput.photos || apifyOutput.photos.length === 0)) {
    issues.push('No photos available in Google Places');
    recommendations.push('Check if the place has photos on Google Maps');
  }

  if (!hasHeroImage && !hasPhotos) {
    issues.push('No images stored in database');
  }

  if (issues.length === 0) {
    console.log('✅ No obvious issues found. Images should be present.');
    console.log('   → Check server logs for image extraction errors');
    console.log('   → Verify Supabase storage bucket permissions');
  } else {
    console.log('❌ Issues Found:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });

    console.log('\n💡 Recommendations:');
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔧 QUICK FIX COMMANDS');
  console.log('='.repeat(80));
  console.log(`\nTo re-run image extraction for this school:`);
  console.log(`   School ID: ${school.id}`);
  console.log(`   Slug: ${school.slug}`);
  console.log(`\nYou can trigger image extraction via:`);
  console.log(`   1. Admin panel: /admin/schools/${school.id}`);
  console.log(`   2. API endpoint: POST /api/admin/schools/${school.id}/extract-images`);
  console.log(`   3. Direct call to: attractionImageExtractor.extractAndUploadSchoolImages('${school.id}')`);
  
  console.log('\n');
}

// Main execution
const schoolName = process.argv[2] || 'London College of United Knowledge';

diagnoseSchoolImages(schoolName)
  .then(() => {
    console.log('✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  });





























