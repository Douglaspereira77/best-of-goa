const { createClient } = require('@supabase/supabase-js');
const OpenAIClient = require('../src/lib/services/openai-client').default;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openaiClient = new OpenAIClient(process.env.OPENAI_API_KEY);

async function regenerateSentiment() {
  console.log('Fetching Leila Min Lebnen restaurant data...');

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, apify_output')
    .eq('slug', 'leila-min-lebnen-the-avenues')
    .single();

  if (error) {
    console.error('Error fetching restaurant:', error);
    return;
  }

  console.log(`Found: ${restaurant.name} (ID: ${restaurant.id})`);

  const reviews = restaurant.apify_output?.reviews || [];
  console.log(`Found ${reviews.length} reviews in apify_output`);

  if (reviews.length === 0) {
    console.log('No reviews to analyze!');
    return;
  }

  // Show sample of reviews
  console.log('\nSample reviews:');
  reviews.slice(0, 3).forEach((r, i) => {
    console.log(`${i + 1}. ${r.name || 'Anonymous'} (${r.stars} stars): ${r.text?.substring(0, 100) || 'No text'}...`);
  });

  console.log('\nAnalyzing sentiment with OpenAI...');
  const sentiment = await openaiClient.analyzeReviewSentiment(reviews);

  if (!sentiment) {
    console.error('Failed to generate sentiment!');
    return;
  }

  console.log('\n✅ Generated Sentiment:');
  console.log(sentiment);

  console.log('\nUpdating database...');
  const { error: updateError } = await supabase
    .from('restaurants')
    .update({ review_sentiment: sentiment })
    .eq('id', restaurant.id);

  if (updateError) {
    console.error('Error updating database:', updateError);
    return;
  }

  console.log('✅ Successfully updated review_sentiment!');
  console.log('\nRefresh http://localhost:3000/places-to-eat/restaurants/leila-min-lebnen-the-avenues to see changes.');
}

regenerateSentiment().catch(console.error);
