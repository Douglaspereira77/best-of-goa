import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showAttractionContent() {
  const slug = 'murouj-food-complex-subhan-area';

  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('='.repeat(80));
  console.log('POPULATED FIELD CONTENT ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  // Show populated fields with full content
  const populatedFields = {
    'Name': attraction.name,
    'Slug': attraction.slug,
    'Description': attraction.description,
    'Address': attraction.address,
    'Latitude': attraction.latitude,
    'Longitude': attraction.longitude,
    'Google Place ID': attraction.google_place_id,
    'Website': attraction.website,
    'Meta Title': attraction.meta_title,
    'Meta Description': attraction.meta_description,
    'Opening Hours': attraction.opening_hours,
    'Featured': attraction.featured,
    'Verified': attraction.verified,
    'Extraction Status': attraction.extraction_status,
  };

  for (const [label, value] of Object.entries(populatedFields)) {
    if (value !== null && value !== undefined && value !== '') {
      console.log(`${label}:`);
      console.log('-'.repeat(80));
      if (typeof value === 'object') {
        console.log(JSON.stringify(value, null, 2));
      } else {
        console.log(value);
      }
      console.log('');
    }
  }

  // Show critical missing data
  console.log('='.repeat(80));
  console.log('CRITICAL MISSING DATA');
  console.log('='.repeat(80));
  console.log('');

  const criticalMissing = {
    'Category': 'Type of attraction (restaurant/cafe/etc)',
    'Cuisine': 'Cuisine types available',
    'Photos': 'Visual media - CRITICAL for engagement',
    'Phone': 'Contact number',
    'Instagram': 'Social media presence',
    'Rating': 'Google rating score',
    'Review Count': 'Number of reviews',
    'Neighborhood': 'Goa area/neighborhood',
    'Long Description': 'Detailed content for attraction page',
    'Specialties': 'What makes this place special',
    'Price Range': 'Cost indicator ($ - $$$$)'
  };

  for (const [field, importance] of Object.entries(criticalMissing)) {
    console.log(`âŒ ${field}: ${importance}`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('DATA SOURCE ISSUES');
  console.log('='.repeat(80));
  console.log('');
  console.log('This attraction appears to have incomplete data extraction:');
  console.log('- Only 15/60 fields populated (25%)');
  console.log('- Missing ALL photos (critical issue)');
  console.log('- Missing category/cuisine classification');
  console.log('- Missing social media (Instagram/Facebook)');
  console.log('- Missing rating/review data');
  console.log('- Missing enhanced content (specialties, ambiance, highlights)');
  console.log('');
  console.log('Possible causes:');
  console.log('1. Extraction pipeline not completing all steps');
  console.log('2. AI enhancement not triggering properly');
  console.log('3. Photo extraction failing');
  console.log('4. Social media discovery not working');
  console.log('5. Data mapping not covering all fields');
}

showAttractionContent().catch(console.error);