const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findTopBeneficiaries() {
  console.log('🔍 Finding restaurants that benefited most from field population...\n');

  // Get all restaurants with social media and pricing data
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, area, instagram, facebook, twitter, tiktok, youtube, linkedin, snapchat, price_level, logo_image, total_reviews_aggregated')
    .order('total_reviews_aggregated', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Calculate benefit score for each restaurant
  const scored = data.map(r => {
    let score = 0;
    let populated = [];

    // Count new fields (those added in our population scripts)
    if (r.tiktok) {
      score++;
      populated.push(`TikTok (${r.tiktok.substring(0, 40)}...)`);
    }
    if (r.youtube) {
      score++;
      populated.push(`YouTube (${r.youtube.substring(0, 40)}...)`);
    }
    if (r.linkedin) {
      score++;
      populated.push(`LinkedIn (${r.linkedin.substring(0, 40)}...)`);
    }
    if (r.snapchat) {
      score++;
      populated.push(`Snapchat (${r.snapchat.substring(0, 40)}...)`);
    }
    if (r.twitter && !r.twitter.includes('Talabat')) {
      score++;
      populated.push(`Twitter (${r.twitter.substring(0, 40)}...)`);
    }
    if (r.facebook && !r.facebook.includes('Talabat')) {
      score++;
      populated.push(`Facebook (${r.facebook.substring(0, 40)}...)`);
    }
    if (r.price_level) {
      score++;
      populated.push(`Price Level (${r.price_level})`);
    }
    if (r.logo_image) {
      score++;
      populated.push(`Logo Image`);
    }

    return {
      name: r.name,
      area: r.area,
      reviews: r.total_reviews_aggregated || 0,
      instagram: r.instagram,
      score,
      populated
    };
  }).filter(r => r.score >= 3) // At least 3 new fields
     .sort((a, b) => {
       // Sort by score first, then by reviews
       if (b.score !== a.score) return b.score - a.score;
       return b.reviews - a.reviews;
     });

  console.log('🌟 TOP 15 RESTAURANTS THAT BENEFITED MOST FROM FIELD POPULATION\n');
  console.log('='.repeat(100));

  scored.slice(0, 15).forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.name} (${r.area})`);
    console.log(`   📊 Reviews: ${r.reviews.toLocaleString()}`);
    console.log(`   ✅ New Fields Populated: ${r.score}`);
    console.log(`   📱 Already had Instagram: ${r.instagram ? 'Yes' : 'No'}`);
    console.log('   🎯 Fields Added:');
    r.populated.forEach(field => {
      console.log(`      • ${field}`);
    });
  });

  console.log('\n\n' + '='.repeat(100));
  console.log('📈 STATISTICS\n');
  console.log(`Total restaurants with 3+ new fields: ${scored.length}`);
  console.log(`Average new fields per restaurant: ${(scored.reduce((sum, r) => sum + r.score, 0) / scored.length).toFixed(1)}`);
  console.log(`Highest number of new fields: ${scored[0].score}`);

  // Group by score
  const byScore = {};
  scored.forEach(r => {
    byScore[r.score] = (byScore[r.score] || 0) + 1;
  });

  console.log('\nDistribution by number of new fields:');
  Object.keys(byScore).sort((a, b) => b - a).forEach(score => {
    console.log(`  ${score} fields: ${byScore[score]} restaurants`);
  });
}

findTopBeneficiaries().then(() => {
  console.log('\n✅ Analysis complete!\n');
  process.exit(0);
});
