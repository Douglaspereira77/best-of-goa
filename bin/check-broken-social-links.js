#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Find all restaurants with social media data
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, instagram, facebook, twitter')
    .or('facebook.not.is.null,instagram.not.is.null,twitter.not.is.null');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const hasIssue = (val) => {
    if (!val) return false;
    // Contains markdown syntax
    if (val.includes('[') || val.includes('](')) return true;
    // Has trailing parenthesis (malformed)
    if (val.endsWith(')')) return true;
    // Is just a handle (no URL) - but this is okay if we normalize it
    if (!val.startsWith('http')) return true;
    return false;
  };

  const problematic = data.filter(r => {
    return hasIssue(r.facebook) || hasIssue(r.instagram) || hasIssue(r.twitter);
  });

  console.log('Total restaurants with social media:', data.length);
  console.log('Problematic records:', problematic.length);
  console.log('');

  // Group by issue type
  const markdownIssues = [];
  const parenthesisIssues = [];
  const handleOnly = [];

  problematic.forEach(r => {
    ['facebook', 'instagram', 'twitter'].forEach(field => {
      const val = r[field];
      if (!val) return;

      if (val.includes('[') || val.includes('](')) {
        markdownIssues.push({ slug: r.slug, field, value: val });
      } else if (val.endsWith(')')) {
        parenthesisIssues.push({ slug: r.slug, field, value: val });
      } else if (!val.startsWith('http')) {
        handleOnly.push({ slug: r.slug, field, value: val });
      }
    });
  });

  console.log('=== MARKDOWN SYNTAX (most severe) ===');
  markdownIssues.forEach(i => {
    console.log(`  ${i.slug} - ${i.field}: ${i.value}`);
  });

  console.log('\n=== TRAILING PARENTHESIS ===');
  parenthesisIssues.forEach(i => {
    console.log(`  ${i.slug} - ${i.field}: ${i.value}`);
  });

  console.log('\n=== HANDLE ONLY (no URL) ===');
  handleOnly.slice(0, 20).forEach(i => {
    console.log(`  ${i.slug} - ${i.field}: ${i.value}`);
  });
  if (handleOnly.length > 20) {
    console.log(`  ... and ${handleOnly.length - 20} more`);
  }
}

check();
