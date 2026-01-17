#!/usr/bin/env node
/**
 * Setup Malls Storage Bucket in Supabase
 *
 * Creates the 'malls' bucket for storing mall images
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('🪣 Setting up malls storage bucket...\n');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError.message);
    return;
  }

  const mallsBucket = buckets.find(b => b.name === 'malls');

  if (mallsBucket) {
    console.log('✅ Malls bucket already exists');
    console.log(`   ID: ${mallsBucket.id}`);
    console.log(`   Public: ${mallsBucket.public}`);
    console.log(`   Created: ${mallsBucket.created_at}`);
    return;
  }

  // Create the bucket
  console.log('Creating malls bucket...');

  const { data, error } = await supabase.storage.createBucket('malls', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (error) {
    console.error('❌ Error creating bucket:', error.message);
    return;
  }

  console.log('✅ Malls bucket created successfully!');
  console.log(`   Name: ${data.name}`);
  console.log('');
  console.log('📋 Bucket Configuration:');
  console.log('   - Public: true');
  console.log('   - Max file size: 10MB');
  console.log('   - Allowed types: JPEG, PNG, WebP');
  console.log('');
  console.log('🔗 Public URL pattern:');
  console.log(`   ${process.env.SUPABASE_URL}/storage/v1/object/public/malls/{mall-slug}/images/{filename}.jpg`);
}

setupStorage().catch(console.error);
