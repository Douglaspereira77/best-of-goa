#!/usr/bin/env node
/**
 * AI Enhancement for Mall
 *
 * Generates AI descriptions, SEO metadata, and FAQs for an existing mall
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

async function chat(prompt, model = 'gpt-4o') {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim() || '';
}

async function enhanceMall(slug) {
  console.log(`\nðŸ¤– Enhancing mall: ${slug}\n`);

  const { data: mall, error } = await supabase
    .from('malls')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !mall) {
    console.error('Mall not found:', error?.message);
    return;
  }

  console.log(`ðŸ“ Found: ${mall.name}`);
  console.log(`   Area: ${mall.area}`);
  console.log(`   Rating: ${mall.google_rating}`);
  console.log(`   Stores: ${mall.total_stores}`);
  console.log('');

  // 1. Generate Description
  console.log('ðŸ“ Generating description...');
  const descPrompt = `Write a comprehensive, SEO-optimized description (200-250 words) for The Avenues Mall in Goa.

Facts:
- Name: ${mall.name}
- Location: ${mall.area}, Goa
- Google Rating: ${mall.google_rating || 4.7}/5
- Total Stores: ${mall.total_stores || 'Over 1,000'} stores
- Total Floors: ${mall.total_floors || 'Multiple floors'}
- Parking: ${mall.total_parking_spaces || '10,000+'} spaces
- Opened: Around 2007

Key Points to Cover:
- One of the largest shopping malls in the Middle East
- Features various districts (The Avenues districts)
- Mix of international luxury brands and local stores
- Entertainment options including cinema, restaurants
- Family-friendly facilities
- Modern architecture and design

Write in professional, engaging tone for a tourism/directory website. Focus on what makes this mall special for visitors.`;

  const description = await chat(descPrompt);
  console.log('âœ… Description generated');

  // 2. Generate Short Description
  console.log('ðŸ“ Generating short description...');
  const shortDescPrompt = `Create a single sentence (under 160 characters) summary for The Avenues Mall Goa. Focus on key selling points like size, variety, and experience.`;
  const shortDescription = await chat(shortDescPrompt, 'gpt-4o-mini');
  console.log('âœ… Short description generated');

  // 3. Generate SEO Metadata
  console.log('ðŸ“ Generating SEO metadata...');
  const seoPrompt = `Generate SEO metadata for The Avenues Mall in Goa.

Provide in JSON format (no markdown):
{
  "meta_title": "under 60 chars, include mall name and Goa",
  "meta_description": "under 160 chars, compelling description with keywords",
  "meta_keywords": ["array", "of", "8-10", "relevant", "keywords"]
}`;

  const seoResponse = await chat(seoPrompt, 'gpt-4o-mini');
  let seoData = {};
  try {
    const jsonMatch = seoResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      seoData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse SEO JSON:', e);
  }
  console.log('âœ… SEO metadata generated');

  // 4. Build update object
  const updates = {
    description: description,
    short_description: shortDescription.substring(0, 160),
    meta_title: seoData.meta_title || `${mall.name} - Shopping Mall in Goa`,
    meta_description: seoData.meta_description || `Visit ${mall.name} in ${mall.area}, Goa.`,
    meta_keywords: seoData.meta_keywords || ['goa mall', 'shopping goa', 'the avenues'],
    og_title: seoData.meta_title || `${mall.name} - Shopping Mall in Goa`,
    og_description: shortDescription.substring(0, 120),
    updated_at: new Date().toISOString()
  };

  console.log('\nðŸ“Š Generated Content:');
  console.log('---');
  console.log('SHORT DESC:', updates.short_description);
  console.log('META TITLE:', updates.meta_title);
  console.log('META DESC:', updates.meta_description);
  console.log('KEYWORDS:', updates.meta_keywords);
  console.log('---');
  console.log('DESCRIPTION:', description.substring(0, 200) + '...');
  console.log('---\n');

  // 5. Update database
  console.log('ðŸ’¾ Saving to database...');
  const { error: updateError } = await supabase
    .from('malls')
    .update(updates)
    .eq('id', mall.id);

  if (updateError) {
    console.error('âŒ Update failed:', updateError.message);
    return;
  }

  console.log('âœ… Mall enhanced successfully!');

  // 6. Check final state
  const { data: finalMall } = await supabase
    .from('malls')
    .select('*')
    .eq('id', mall.id)
    .single();

  let populatedCount = 0;
  let totalFields = 0;

  for (const [key, value] of Object.entries(finalMall)) {
    if (!['id', 'created_at', 'apify_output', 'firecrawl_output', 'extraction_progress'].includes(key)) {
      totalFields++;
      if (value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0)) {
        populatedCount++;
      }
    }
  }

  console.log(`\nðŸ“Š Final Field Population: ${populatedCount}/${totalFields} (${Math.round(populatedCount/totalFields*100)}%)`);
}

const slug = process.argv[2] || 'the-avenues-mall-goa';
enhanceMall(slug).catch(console.error);
