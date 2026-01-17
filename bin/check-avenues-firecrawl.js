#!/usr/bin/env node

/**
 * BOK Content Tester - Firecrawl Output Deep Inspection
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFirecrawlOutput() {
  const { data: mall, error } = await supabase
    .from('malls')
    .select('name, firecrawl_output, extraction_progress')
    .ilike('name', '%avenues%')
    .single();

  if (error || !mall) {
    console.error('Failed to fetch mall:', error?.message);
    return;
  }

  console.log('='.repeat(80));
  console.log('FIRECRAWL OUTPUT STRUCTURE ANALYSIS');
  console.log('='.repeat(80));

  const fc = mall.firecrawl_output || {};

  console.log('\n1. TOP-LEVEL KEYS:');
  Object.keys(fc).forEach(key => {
    const value = fc[key];
    const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
    console.log(`  - ${key}: ${type}`);
  });

  if (fc.stores) {
    console.log('\n2. STORES DATA:');
    console.log('  Type:', Array.isArray(fc.stores) ? `array[${fc.stores.length}]` : typeof fc.stores);
    if (Array.isArray(fc.stores) && fc.stores.length > 0) {
      console.log('  Sample store:', JSON.stringify(fc.stores[0], null, 4));
    } else if (typeof fc.stores === 'object') {
      console.log('  Structure:', JSON.stringify(fc.stores, null, 4).substring(0, 1000));
    }
  }

  if (fc.general) {
    console.log('\n3. GENERAL INFORMATION:');
    console.log(JSON.stringify(fc.general, null, 2));
  }

  if (fc.tripadvisor) {
    console.log('\n4. TRIPADVISOR DATA:');
    console.log(JSON.stringify(fc.tripadvisor, null, 2));
  }

  if (fc.website_scrape) {
    console.log('\n5. WEBSITE SCRAPE DATA:');
    const ws = fc.website_scrape;
    console.log('  Keys:', Object.keys(ws).join(', '));
    // Show sample
    if (ws.url) console.log('  URL:', ws.url);
    if (ws.title) console.log('  Title:', ws.title);
    if (ws.description) console.log('  Description:', ws.description?.substring(0, 200));
    if (ws.content) console.log('  Content Length:', ws.content.length);
  }

  if (fc.social_media_search) {
    console.log('\n6. SOCIAL MEDIA SEARCH RESULTS:');
    console.log(JSON.stringify(fc.social_media_search, null, 2));
  }

  console.log('\n' + '='.repeat(80));
  console.log('EXTRACTION PROGRESS:');
  console.log('='.repeat(80));
  if (mall.extraction_progress) {
    console.log(JSON.stringify(mall.extraction_progress, null, 2));
  } else {
    console.log('No extraction progress recorded');
  }
}

checkFirecrawlOutput().catch(console.error);