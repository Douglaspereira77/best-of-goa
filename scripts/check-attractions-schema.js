import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('='.repeat(80));
  console.log('ATTRACTIONS DATABASE SCHEMA ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  // Get a sample attraction to see all columns
  const { data: sample, error } = await supabase
    .from('attractions')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching sample:', error);
    return;
  }

  console.log('AVAILABLE COLUMNS IN ATTRACTIONS TABLE:');
  console.log('-'.repeat(80));

  const columns = Object.keys(sample || {}).sort();
  columns.forEach((col, idx) => {
    const value = sample[col];
    const type = Array.isArray(value) ? 'array' :
                 value === null ? 'null' :
                 typeof value;
    console.log(`${(idx + 1).toString().padStart(3)}. ${col.padEnd(30)} [${type}]`);
  });

  console.log('');
  console.log(`Total columns: ${columns.length}`);
  console.log('');

  // Check for rating-related columns
  console.log('='.repeat(80));
  console.log('RATING FIELD NAMES:');
  console.log('-'.repeat(80));
  const ratingFields = columns.filter(c =>
    c.includes('rating') || c.includes('review') || c.includes('score')
  );
  ratingFields.forEach(field => {
    console.log(`  - ${field}: ${sample[field] || 'NULL'}`);
  });

  // Check for social media columns
  console.log('');
  console.log('='.repeat(80));
  console.log('SOCIAL MEDIA FIELD NAMES:');
  console.log('-'.repeat(80));
  const socialFields = columns.filter(c =>
    c.includes('instagram') || c.includes('facebook') ||
    c.includes('tiktok') || c.includes('twitter') ||
    c.includes('youtube') || c.includes('social')
  );
  socialFields.forEach(field => {
    console.log(`  - ${field}: ${sample[field] || 'NULL'}`);
  });

  // Check for photo columns
  console.log('');
  console.log('='.repeat(80));
  console.log('PHOTO/IMAGE FIELD NAMES:');
  console.log('-'.repeat(80));
  const photoFields = columns.filter(c =>
    c.includes('photo') || c.includes('image') || c.includes('picture')
  );
  photoFields.forEach(field => {
    console.log(`  - ${field}: ${typeof sample[field]} = ${JSON.stringify(sample[field])?.substring(0, 100) || 'NULL'}`);
  });

  // Check for category/classification columns
  console.log('');
  console.log('='.repeat(80));
  console.log('CATEGORY/CLASSIFICATION FIELD NAMES:');
  console.log('-'.repeat(80));
  const categoryFields = columns.filter(c =>
    c.includes('category') || c.includes('type') ||
    c.includes('cuisine') || c.includes('classification')
  );
  categoryFields.forEach(field => {
    console.log(`  - ${field}: ${sample[field] || 'NULL'}`);
  });

  // Check what tables exist for attractions
  console.log('');
  console.log('='.repeat(80));
  console.log('CHECKING RELATED TABLES:');
  console.log('-'.repeat(80));

  const tablesToCheck = [
    'attraction_categories',
    'attraction_amenities',
    'attraction_features',
    'attraction_attraction_categories',
    'attraction_attraction_amenities',
    'attraction_attraction_features',
    'attraction_reviews',
    'attraction_faqs'
  ];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: EXISTS (${data?.length || 0} sample records)`);
      if (data && data.length > 0) {
        console.log(`     Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  console.log('');
  console.log('='.repeat(80));
}

checkSchema().catch(console.error);
