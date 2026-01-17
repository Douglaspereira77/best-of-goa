/**
 * Check if school website has images we can extract
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWebsiteImages(schoolName) {
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .ilike('name', `%${schoolName}%`)
    .limit(1);

  if (!schools || schools.length === 0) {
    console.log('School not found');
    return;
  }

  const school = schools[0];
  console.log(`\n🔍 Checking website images for: ${school.name}\n`);

  const firecrawlOutput = school.firecrawl_output;
  
  if (!firecrawlOutput) {
    console.log('❌ No firecrawl output found');
    return;
  }

  console.log('✅ Firecrawl output exists');
  console.log(`   Website: ${school.website || 'N/A'}`);

  // Check for images in markdown
  const markdown = firecrawlOutput.markdown || firecrawlOutput.content || '';
  const imageMatches = markdown.match(/!\[.*?\]\((https?:\/\/[^\s\)]+\.(jpg|jpeg|png|gif|webp))/gi);
  
  if (imageMatches) {
    console.log(`\n✅ Found ${imageMatches.length} image URLs in website content:`);
    imageMatches.slice(0, 10).forEach((match, i) => {
      const url = match.match(/\((https?:\/\/[^\s\)]+)\)/i)?.[1];
      if (url) {
        console.log(`   ${i + 1}. ${url}`);
      }
    });
    console.log('\n💡 These images could be extracted from the website!');
  } else {
    console.log('\n⚠️  No image URLs found in website markdown');
  }

  // Check for images in HTML
  const html = firecrawlOutput.html || '';
  const imgTags = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
  
  if (imgTags) {
    console.log(`\n✅ Found ${imgTags.length} <img> tags in HTML:`);
    imgTags.slice(0, 10).forEach((tag, i) => {
      const src = tag.match(/src=["']([^"']+)["']/i)?.[1];
      if (src && (src.includes('http') || src.startsWith('//'))) {
        console.log(`   ${i + 1}. ${src}`);
      }
    });
  }

  // Check social media for images
  console.log('\n📱 Social Media Profiles:');
  if (school.instagram) console.log(`   Instagram: ${school.instagram}`);
  if (school.facebook) console.log(`   Facebook: ${school.facebook}`);
  if (school.website) console.log(`   Website: ${school.website}`);
  
  console.log('\n💡 Recommendation:');
  console.log('   If website has images, we could enhance the image extractor to:');
  console.log('   1. Extract images from firecrawl_output markdown/HTML');
  console.log('   2. Download and process them with Vision API');
  console.log('   3. Upload to Supabase storage');
}

checkWebsiteImages('London College of United Knowledge')
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });





























