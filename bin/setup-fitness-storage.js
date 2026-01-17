/**
 * Setup script for fitness storage bucket
 * Creates the 'fitness' bucket in Supabase Storage if it doesn't exist
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('🪣 Setting up fitness storage bucket...\n');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError.message);
    return;
  }

  console.log('📋 Existing buckets:');
  buckets.forEach(b => console.log(`   - ${b.name} (public: ${b.public})`));
  console.log('');

  const fitnessBucket = buckets.find(b => b.name === 'fitness');

  if (fitnessBucket) {
    console.log('✅ Fitness bucket already exists');
    console.log(`   ID: ${fitnessBucket.id}`);
    console.log(`   Public: ${fitnessBucket.public}`);
    console.log(`   Created: ${fitnessBucket.created_at}`);
    return;
  }

  // Create the bucket
  console.log('Creating fitness bucket...');

  const { data, error } = await supabase.storage.createBucket('fitness', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (error) {
    console.error('❌ Error creating bucket:', error.message);
    return;
  }

  console.log('✅ Fitness bucket created successfully!');
  console.log(`   Name: ${data.name}`);
  console.log('');
  console.log('📋 Bucket Configuration:');
  console.log('   - Public: true');
  console.log('   - Max file size: 10MB');
  console.log('   - Allowed types: JPEG, PNG, WebP');
  console.log('');
  console.log('🔗 Public URL pattern:');
  console.log(`   ${process.env.SUPABASE_URL}/storage/v1/object/public/fitness/{gym-slug}/images/{filename}.jpg`);
}

setupStorage().catch(console.error);































