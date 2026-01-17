#!/usr/bin/env node
/**
 * Debug AI Enhancement Step
 *
 * Tests the AI enhancement pipeline to see where it's failing
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Inline OpenAI client to test
class TestOpenAIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async chat(prompt, model = 'gpt-4o-mini') {
    console.log(`\n[OpenAI] Sending request to ${model}...`);
    console.log(`[OpenAI] Prompt length: ${prompt.length} chars`);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    console.log(`[OpenAI] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenAI] Error response: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || '';
    console.log(`[OpenAI] Response length: ${content.length} chars`);
    return content;
  }
}

async function debugAIEnhancement() {
  console.log('ðŸ” Debug AI Enhancement Step');
  console.log('='.repeat(60));

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('âŒ OPENAI_API_KEY not found in environment!');
    return;
  }
  console.log('âœ… OpenAI API key found:', apiKey.substring(0, 10) + '...');

  const openaiClient = new TestOpenAIClient(apiKey);

  // Get a mall with data but no description
  const { data: mall, error } = await supabase
    .from('malls')
    .select('*')
    .is('description', null)
    .not('firecrawl_output', 'is', null)
    .limit(1)
    .single();

  if (error || !mall) {
    console.error('No mall found for testing:', error);
    return;
  }

  console.log(`\nðŸ“ Testing with: ${mall.name}`);
  console.log(`   Slug: ${mall.slug}`);
  console.log(`   Has firecrawl_output: ${!!mall.firecrawl_output}`);
  console.log(`   Has apify_output: ${!!mall.apify_output}`);

  // Step 1: Test description generation
  console.log('\n--- STEP 1: Generate Description ---');
  try {
    const descriptionPrompt = `Write a comprehensive description (150-200 words) for this Goa shopping mall:

Mall Name: ${mall.name}
Location: ${mall.area}, Goa
Google Rating: ${mall.google_rating || 'N/A'} (${mall.google_review_count || 0} reviews)
Total Stores: ${mall.total_stores || 'Unknown'}
Total Floors: ${mall.total_floors || 'Unknown'}
Parking Spaces: ${mall.total_parking_spaces || 'Unknown'}

Additional info from search results:
${JSON.stringify(mall.firecrawl_output?.general?.results?.slice(0, 3) || [], null, 2)}

Write in a professional, informative tone highlighting the mall's features, shopping experience, and why visitors should visit. Include information about the variety of stores, amenities, and overall atmosphere.`;

    console.log('Prompt preview:', descriptionPrompt.substring(0, 300) + '...');

    const description = await openaiClient.chat(descriptionPrompt, 'gpt-4o');
    console.log('\nâœ… Description generated:');
    console.log(description.substring(0, 200) + '...');

    // Step 2: Test short description
    console.log('\n--- STEP 2: Generate Short Description ---');
    const shortDescriptionPrompt = `Create a one-sentence summary (under 160 characters) for ${mall.name} shopping mall in Goa. Focus on key selling points.`;

    const shortDescription = await openaiClient.chat(shortDescriptionPrompt, 'gpt-4o-mini');
    console.log('âœ… Short description:', shortDescription);

    // Step 3: Test SEO metadata
    console.log('\n--- STEP 3: Generate SEO Metadata ---');
    const seoPrompt = `Generate SEO metadata for this Goa shopping mall page:

Mall: ${mall.name}
Location: ${mall.area}, Goa
Stores: ${mall.total_stores || 'many'}
Features: Shopping, dining, entertainment

Provide in JSON format:
{
  "meta_title": "under 60 chars, include mall name and Goa",
  "meta_description": "under 160 chars, compelling description with keywords",
  "meta_keywords": ["array", "of", "5-10", "keywords"]
}`;

    const seoResponse = await openaiClient.chat(seoPrompt, 'gpt-4o-mini');
    console.log('Raw SEO response:', seoResponse);

    let seoData = {};
    try {
      const jsonMatch = seoResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoData = JSON.parse(jsonMatch[0]);
        console.log('âœ… Parsed SEO data:', seoData);
      } else {
        console.error('âŒ No JSON found in response');
      }
    } catch (e) {
      console.error('âŒ Failed to parse SEO JSON:', e.message);
    }

    // Step 4: Test database update
    console.log('\n--- STEP 4: Test Database Update ---');
    const updates = {
      description: description.trim(),
      short_description: shortDescription.trim().substring(0, 160),
    };

    if (seoData.meta_title) updates.meta_title = seoData.meta_title;
    if (seoData.meta_description) updates.meta_description = seoData.meta_description;
    if (seoData.meta_keywords) updates.meta_keywords = seoData.meta_keywords;

    console.log('Updates to apply:', Object.keys(updates));

    const { error: updateError } = await supabase
      .from('malls')
      .update(updates)
      .eq('id', mall.id);

    if (updateError) {
      console.error('âŒ Database update failed:', updateError);
    } else {
      console.log('âœ… Database update successful!');
    }

    // Verify
    const { data: updatedMall } = await supabase
      .from('malls')
      .select('description, short_description, meta_title')
      .eq('id', mall.id)
      .single();

    console.log('\n--- VERIFICATION ---');
    console.log('Description saved:', !!updatedMall.description);
    console.log('Short description saved:', !!updatedMall.short_description);
    console.log('Meta title saved:', !!updatedMall.meta_title);

  } catch (err) {
    console.error('\nâŒ ERROR:', err);
    console.error('Stack:', err.stack);
  }
}

debugAIEnhancement().catch(console.error);
