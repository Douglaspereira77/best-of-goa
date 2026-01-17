import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyRelationships() {
  const attractionId = 'b7f3b42b-1787-4277-8970-665c563ebeec';

  console.log('='.repeat(80));
  console.log('ATTRACTION RELATIONSHIPS VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Attraction ID: ${attractionId}`);
  console.log('');

  // Check reviews
  console.log('📝 REVIEWS:');
  console.log('-'.repeat(80));
  const { data: reviews, error: reviewsError } = await supabase
    .from('attraction_reviews')
    .select('*')
    .eq('attraction_id', attractionId)
    .limit(5);

  if (reviewsError) {
    console.log(`❌ Error fetching reviews: ${reviewsError.message}`);
  } else if (!reviews || reviews.length === 0) {
    console.log('❌ No reviews found');
  } else {
    console.log(`✅ Found ${reviews.length} reviews (showing first 5):`);
    reviews.forEach((review, idx) => {
      console.log(`  ${idx + 1}. ${review.author_name} - ${review.rating} stars`);
      console.log(`     "${review.review_text.substring(0, 100)}..."`);
    });
  }
  console.log('');

  // Check categories
  console.log('🏷️  CATEGORIES:');
  console.log('-'.repeat(80));

  // First check if junction table exists
  const { data: categories, error: categoriesError } = await supabase
    .from('attraction_attraction_categories')
    .select(`
      attraction_categories (
        id,
        name,
        slug
      )
    `)
    .eq('attraction_id', attractionId);

  if (categoriesError) {
    console.log(`❌ Error or table doesn't exist: ${categoriesError.message}`);
  } else if (!categories || categories.length === 0) {
    console.log('❌ No categories assigned');
  } else {
    console.log(`✅ Assigned to ${categories.length} categories:`);
    categories.forEach((cat) => {
      if (cat.attraction_categories) {
        console.log(`  - ${cat.attraction_categories.name} (${cat.attraction_categories.slug})`);
      }
    });
  }
  console.log('');

  // Check amenities
  console.log('🎯 AMENITIES:');
  console.log('-'.repeat(80));

  const { data: amenities, error: amenitiesError } = await supabase
    .from('attraction_attraction_amenities')
    .select(`
      attraction_amenities (
        id,
        name,
        slug
      )
    `)
    .eq('attraction_id', attractionId);

  if (amenitiesError) {
    console.log(`❌ Error or table doesn't exist: ${amenitiesError.message}`);
  } else if (!amenities || amenities.length === 0) {
    console.log('❌ No amenities assigned');
  } else {
    console.log(`✅ Has ${amenities.length} amenities:`);
    amenities.forEach((amenity) => {
      if (amenity.attraction_amenities) {
        console.log(`  - ${amenity.attraction_amenities.name}`);
      }
    });
  }
  console.log('');

  // Check features
  console.log('⭐ FEATURES:');
  console.log('-'.repeat(80));

  const { data: features, error: featuresError } = await supabase
    .from('attraction_attraction_features')
    .select(`
      attraction_features (
        id,
        name,
        slug
      )
    `)
    .eq('attraction_id', attractionId);

  if (featuresError) {
    console.log(`❌ Error or table doesn't exist: ${featuresError.message}`);
  } else if (!features || features.length === 0) {
    console.log('❌ No features assigned');
  } else {
    console.log(`✅ Has ${features.length} features:`);
    features.forEach((feature) => {
      if (feature.attraction_features) {
        console.log(`  - ${feature.attraction_features.name}`);
      }
    });
  }
  console.log('');

  // Check FAQs
  console.log('❓ FAQs:');
  console.log('-'.repeat(80));

  const { data: faqs, error: faqsError } = await supabase
    .from('attraction_faqs')
    .select('*')
    .eq('attraction_id', attractionId);

  if (faqsError) {
    console.log(`❌ Error or table doesn't exist: ${faqsError.message}`);
  } else if (!faqs || faqs.length === 0) {
    console.log('❌ No FAQs found');
  } else {
    console.log(`✅ Found ${faqs.length} FAQs:`);
    faqs.forEach((faq, idx) => {
      console.log(`  ${idx + 1}. Q: ${faq.question}`);
      console.log(`     A: ${faq.answer.substring(0, 100)}...`);
      console.log(`     Category: ${faq.category || 'N/A'}`);
    });
  }
  console.log('');

  // Check photos in database
  console.log('📸 PHOTOS (from database field):');
  console.log('-'.repeat(80));

  const { data: attraction } = await supabase
    .from('attractions')
    .select('photos, cover_image')
    .eq('id', attractionId)
    .single();

  if (attraction) {
    if (attraction.photos && attraction.photos.length > 0) {
      console.log(`✅ Photos array: ${attraction.photos.length} photos`);
      attraction.photos.slice(0, 3).forEach((photo, idx) => {
        console.log(`  ${idx + 1}. ${photo}`);
      });
      if (attraction.photos.length > 3) {
        console.log(`  ... and ${attraction.photos.length - 3} more`);
      }
    } else {
      console.log('❌ Photos array is empty or null');
    }

    if (attraction.cover_image) {
      console.log(`✅ Cover image: ${attraction.cover_image}`);
    } else {
      console.log('❌ No cover image set');
    }
  }
  console.log('');

  // Check apify_output for raw data
  console.log('🔍 RAW DATA SOURCES:');
  console.log('-'.repeat(80));

  const { data: attractionData } = await supabase
    .from('attractions')
    .select('apify_output, firecrawl_output')
    .eq('id', attractionId)
    .single();

  if (attractionData) {
    if (attractionData.apify_output) {
      console.log('✅ Apify output exists');
      if (attractionData.apify_output.imageUrls || attractionData.apify_output.photos) {
        const photoCount = (attractionData.apify_output.imageUrls?.length || 0) +
                          (attractionData.apify_output.photos?.length || 0);
        console.log(`  - Contains ${photoCount} photo URLs`);
      }
      if (attractionData.apify_output.totalScore || attractionData.apify_output.rating) {
        console.log(`  - Rating: ${attractionData.apify_output.totalScore || attractionData.apify_output.rating}`);
      }
      if (attractionData.apify_output.reviewsCount) {
        console.log(`  - Review count: ${attractionData.apify_output.reviewsCount}`);
      }
    } else {
      console.log('❌ No Apify output found');
    }

    if (attractionData.firecrawl_output) {
      console.log('✅ Firecrawl output exists');
      if (attractionData.firecrawl_output.website_scrape) {
        console.log('  - Website scrape data present');
      }
      if (attractionData.firecrawl_output.social_media_search) {
        console.log('  - Social media search data present');
        const social = attractionData.firecrawl_output.social_media_search;
        if (social.instagram) console.log(`    Instagram: ${social.instagram.confidence || 'found'}`);
        if (social.facebook) console.log(`    Facebook: ${social.facebook.confidence || 'found'}`);
        if (social.tiktok) console.log(`    TikTok: ${social.tiktok.confidence || 'found'}`);
      }
      if (attractionData.firecrawl_output.ai_suggestions) {
        console.log('  - AI suggestions present');
        const ai = attractionData.firecrawl_output.ai_suggestions;
        if (ai.categories) console.log(`    Categories: ${ai.categories.length} suggested`);
        if (ai.amenities) console.log(`    Amenities: ${ai.amenities.length} suggested`);
        if (ai.features) console.log(`    Features: ${ai.features.length} suggested`);
        if (ai.faqs) console.log(`    FAQs: ${ai.faqs.length} generated`);
      }
    } else {
      console.log('❌ No Firecrawl output found');
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

verifyRelationships().catch(console.error);
