#!/usr/bin/env node
/**
 * Fix broken social media links in restaurants table
 *
 * Issues found:
 * 1. Markdown syntax in values (e.g., "meatmoot.goa)[Instagram](https:")
 * 2. Trailing parenthesis (e.g., "https://instagram.com/blackrabbitkw)")
 * 3. Scraping artifacts (e.g., "sharer", "intent" from share button URLs)
 * 4. Handle-only values that should be cleaned up
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Scraping artifacts that should be removed (not real social handles)
const INVALID_VALUES = [
  'sharer',
  'intent',
  'share',
];

// Clean a social media value
function cleanSocialValue(val, platform) {
  if (!val) return null;

  let cleaned = val.trim();

  // Remove markdown syntax - extract the first handle/URL before any markdown
  if (cleaned.includes('[') || cleaned.includes('](')) {
    // Extract everything before the markdown starts
    cleaned = cleaned.split(/[\[\]]/)[0].trim();
    // Remove any trailing parenthesis from malformed markdown
    cleaned = cleaned.replace(/\)+$/, '');
  }

  // Remove trailing parenthesis
  while (cleaned.endsWith(')')) {
    cleaned = cleaned.slice(0, -1);
  }

  // Remove trailing slashes from empty paths like https://instagram.com/
  if (cleaned.match(/^https?:\/\/[^/]+\/$/)) {
    return null; // Empty profile URL, useless
  }

  // Check if it's just a scraping artifact
  const lowerCleaned = cleaned.toLowerCase();
  if (INVALID_VALUES.includes(lowerCleaned)) {
    return null;
  }

  // If it's just numbers (like Facebook page ID), it might be valid but let's check
  if (/^\d+$/.test(cleaned)) {
    // Facebook page IDs are valid, convert to URL
    if (platform === 'facebook') {
      return `https://facebook.com/${cleaned}`;
    }
    // For other platforms, numeric-only is likely invalid
    return null;
  }

  // If it's a valid URL, return it
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }

  // If it's a handle (not starting with http), convert to URL
  // Remove @ prefix if present
  const handle = cleaned.startsWith('@') ? cleaned.slice(1) : cleaned;

  // Skip if handle is empty after cleaning
  if (!handle || handle.length < 2) {
    return null;
  }

  // Build full URL based on platform
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'twitter':
      return `https://twitter.com/${handle}`;
    default:
      return null;
  }
}

async function fixBrokenLinks(dryRun = true) {
  console.log(dryRun ? '=== DRY RUN ===' : '=== APPLYING FIXES ===');
  console.log('');

  // Get all restaurants with social media data
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, instagram, facebook, twitter')
    .or('facebook.not.is.null,instagram.not.is.null,twitter.not.is.null');

  if (error) {
    console.error('Error:', error);
    return;
  }

  let fixCount = 0;
  const fixes = [];

  for (const r of data) {
    const updates = {};
    let hasChanges = false;

    ['instagram', 'facebook', 'twitter'].forEach(field => {
      const original = r[field];
      if (!original) return;

      const cleaned = cleanSocialValue(original, field);

      if (cleaned !== original) {
        updates[field] = cleaned;
        hasChanges = true;
        fixes.push({
          slug: r.slug,
          field,
          original,
          cleaned
        });
      }
    });

    if (hasChanges) {
      fixCount++;

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update(updates)
          .eq('id', r.id);

        if (updateError) {
          console.error(`Error updating ${r.slug}:`, updateError);
        }
      }
    }
  }

  console.log('Fixes to apply:');
  fixes.forEach(f => {
    console.log(`  ${f.slug} - ${f.field}:`);
    console.log(`    FROM: ${f.original}`);
    console.log(`    TO:   ${f.cleaned || '(null)'}`);
  });

  console.log('');
  console.log(`Total restaurants to fix: ${fixCount}`);
  console.log(`Total field changes: ${fixes.length}`);

  if (dryRun) {
    console.log('');
    console.log('Run with --apply to apply these fixes');
  } else {
    console.log('');
    console.log('Fixes applied successfully!');
  }
}

// Check command line args
const dryRun = !process.argv.includes('--apply');
fixBrokenLinks(dryRun);
