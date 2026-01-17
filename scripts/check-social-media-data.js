import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSocialMedia() {
  const attractionId = 'b7f3b42b-1787-4277-8970-665c563ebeec';

  const { data: attraction } = await supabase
    .from('attractions')
    .select('firecrawl_output')
    .eq('id', attractionId)
    .single();

  console.log('='.repeat(80));
  console.log('SOCIAL MEDIA SEARCH RESULTS');
  console.log('='.repeat(80));
  console.log('');

  if (attraction?.firecrawl_output?.social_media_search) {
    const social = attraction.firecrawl_output.social_media_search;

    console.log('Instagram:');
    console.log(JSON.stringify(social.instagram, null, 2));
    console.log('');

    console.log('Facebook:');
    console.log(JSON.stringify(social.facebook, null, 2));
    console.log('');

    console.log('TikTok:');
    console.log(JSON.stringify(social.tiktok, null, 2));
    console.log('');

    console.log('Twitter:');
    console.log(JSON.stringify(social.twitter, null, 2));
    console.log('');

    console.log('YouTube:');
    console.log(JSON.stringify(social.youtube, null, 2));
    console.log('');
  } else {
    console.log('No social media search data found');
  }

  console.log('='.repeat(80));
  console.log('AI SUGGESTIONS');
  console.log('='.repeat(80));
  console.log('');

  if (attraction?.firecrawl_output?.ai_suggestions) {
    const ai = attraction.firecrawl_output.ai_suggestions;

    console.log('Categories:');
    console.log(JSON.stringify(ai.categories, null, 2));
    console.log('');

    console.log('Amenities:');
    console.log(JSON.stringify(ai.amenities, null, 2));
    console.log('');

    console.log('Features:');
    console.log(JSON.stringify(ai.features, null, 2));
    console.log('');
  } else {
    console.log('No AI suggestions found');
  }
}

checkSocialMedia().catch(console.error);
