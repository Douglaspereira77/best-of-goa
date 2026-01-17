#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySocialMedia() {
  const { data } = await supabase
    .from('hotels')
    .select('name, instagram, facebook, tiktok, twitter, youtube, linkedin, firecrawl_output')
    .eq('id', '94bcc666-9e4a-438d-a4b2-77a97f8d8d3a')
    .single();

  console.log('Hotel:', data.name);
  console.log('\n✅ Social Media Fields in Database:');
  console.log('  Instagram:', data.instagram || 'NOT FOUND');
  console.log('  Facebook:', data.facebook || 'NOT FOUND');
  console.log('  TikTok:', data.tiktok || 'NOT FOUND');
  console.log('  Twitter:', data.twitter || 'NOT FOUND');
  console.log('  YouTube:', data.youtube || 'NOT FOUND');
  console.log('  LinkedIn:', data.linkedin || 'NOT FOUND');

  console.log('\n✅ Social Media Search Results:');
  const social = data.firecrawl_output.social_media_search;

  ['instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'linkedin', 'snapchat'].forEach(platform => {
    if (social[platform].found) {
      console.log(`  ${platform}:`, social[platform].url, `(source: ${social[platform].source})`);
    }
  });
}

verifySocialMedia();
