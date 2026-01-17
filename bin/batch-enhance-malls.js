#!/usr/bin/env node
/**
 * Batch AI Enhancement for Malls
 *
 * Generates AI content for all malls missing descriptions
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OpenAIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async chat(prompt, model = 'gpt-4o-mini') {
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content?.trim() || '';
  }
}

async function enhanceMall(mall, openaiClient) {
  console.log(`\nðŸ¬ Enhancing: ${mall.name}`);

  try {
    // Generate description
    const descriptionPrompt = `Write a comprehensive description (150-200 words) for this Goa shopping mall:

Mall Name: ${mall.name}
Location: ${mall.area}, Goa
Google Rating: ${mall.google_rating || 'N/A'} (${mall.google_review_count || 0} reviews)
Total Stores: ${mall.total_stores || 'Unknown'}
Total Floors: ${mall.total_floors || 'Unknown'}
Parking Spaces: ${mall.total_parking_spaces || 'Unknown'}

Additional info from search results:
${JSON.stringify(mall.firecrawl_output?.general?.results?.slice(0, 3) || [], null, 2)}

Write in a professional, informative tone highlighting the mall's features, shopping experience, and why visitors should visit.`;

    const description = await openaiClient.chat(descriptionPrompt, 'gpt-4o');
    console.log(`   âœ… Description: ${description.length} chars`);

    // Generate short description
    const shortDescriptionPrompt = `Create a one-sentence summary (under 160 characters) for ${mall.name} shopping mall in Goa. Focus on key selling points.`;
    const shortDescription = await openaiClient.chat(shortDescriptionPrompt, 'gpt-4o-mini');
    console.log(`   âœ… Short desc: ${shortDescription.length} chars`);

    // Generate SEO metadata
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
    let seoData = {};
    try {
      const jsonMatch = seoResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log(`   âš ï¸  SEO JSON parse failed, using defaults`);
    }

    // Prepare updates
    const updates = {
      description: description.trim(),
      short_description: shortDescription.trim().substring(0, 160),
    };

    if (seoData.meta_title) {
      updates.meta_title = seoData.meta_title;
      updates.og_title = seoData.meta_title;
    }
    if (seoData.meta_description) {
      updates.meta_description = seoData.meta_description;
      updates.og_description = seoData.meta_description;
    }
    if (seoData.meta_keywords) {
      updates.meta_keywords = seoData.meta_keywords;
    }

    // Update database
    const { error } = await supabase
      .from('malls')
      .update(updates)
      .eq('id', mall.id);

    if (error) {
      console.error(`   âŒ DB update failed:`, error.message);
      return false;
    }

    console.log(`   âœ… Database updated successfully`);
    return true;

  } catch (err) {
    console.error(`   âŒ Enhancement failed:`, err.message);
    return false;
  }
}

async function batchEnhanceMalls() {
  console.log('ðŸ¤– Batch AI Enhancement for Malls');
  console.log('='.repeat(60));

  const openaiClient = new OpenAIClient(process.env.OPENAI_API_KEY);

  // Get malls missing descriptions
  const { data: malls, error } = await supabase
    .from('malls')
    .select('*')
    .is('description', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching malls:', error);
    return;
  }

  console.log(`Found ${malls.length} malls needing AI enhancement\n`);

  if (malls.length === 0) {
    console.log('All malls already have descriptions!');
    return;
  }

  let successful = 0;
  let failed = 0;

  // Process one at a time to avoid rate limits
  for (let i = 0; i < malls.length; i++) {
    const mall = malls[i];
    console.log(`\n[${i + 1}/${malls.length}]`);

    const success = await enhanceMall(mall, openaiClient);
    if (success) {
      successful++;
    } else {
      failed++;
    }

    // Rate limit: wait 2 seconds between API calls
    if (i < malls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('ðŸ“Š ENHANCEMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`âœ… Successful: ${successful}`);
  console.log(`âŒ Failed: ${failed}`);
  console.log(`ðŸ“ Total: ${malls.length}`);
}

batchEnhanceMalls().catch(console.error);
