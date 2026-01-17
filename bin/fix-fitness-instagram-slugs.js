#!/usr/bin/env node

/**
 * Fix Fitness Places with Instagram Handles as Slugs
 *
 * Ahrefs audit (Dec 2025) found 404 errors for URLs like:
 * - /things-to-do/fitness/@gorillas_kw
 * - /things-to-do/fitness/@omega.gym.ku
 * - /things-to-do/fitness/The%20Scandinavian%20Gym
 *
 * These occur because some fitness_places have Instagram handles or
 * improperly formatted strings stored in the slug column instead of
 * proper URL slugs.
 *
 * This script:
 * 1. Finds all fitness places with problematic slugs
 * 2. Shows what needs to be fixed
 * 3. Optionally fixes them with proper slugs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Arabic to English transliterations for common gym names
const ARABIC_TRANSLATIONS = {
  'نادي رامبو الصحي': 'rambo-health-club',
};

// Generate a proper slug from a name
function generateSlug(name, id) {
  // Check for known Arabic translations first
  if (ARABIC_TRANSLATIONS[name]) {
    return ARABIC_TRANSLATIONS[name];
  }

  // First, try to extract English portion if mixed
  const englishMatch = name.match(/[a-zA-Z][a-zA-Z\s&'-]+[a-zA-Z]/);
  const baseName = englishMatch ? englishMatch[0] : name;

  let slug = baseName
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')      // Replace & with 'and'
    .replace(/[^\w\s-]/g, '') // Remove special characters (including Arabic)
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Remove consecutive hyphens
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens

  // If slug is empty (all Arabic), use a UUID-based fallback
  if (!slug && id) {
    slug = `fitness-place-${id.slice(0, 8)}`;
  }

  return slug;
}

async function findProblematicSlugs() {
  console.log('Searching for fitness places with problematic slugs...\n');

  const { data: allFitness, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, instagram')
    .order('name');

  if (error) {
    console.error('Error fetching fitness places:', error.message);
    return [];
  }

  const problematic = allFitness.filter(fp => {
    if (!fp.slug) return true; // Missing slug
    if (fp.slug.startsWith('@')) return true; // Instagram handle
    if (fp.slug.includes('%20') || fp.slug.includes('%')) return true; // URL encoded
    if (fp.slug.includes(' ')) return true; // Contains spaces
    if (fp.slug.includes('.')) return true; // Contains dots (like @omega.gym.ku)
    if (/[A-Z]/.test(fp.slug)) return true; // Contains uppercase
    if (fp.slug.startsWith('-')) return true; // Starts with hyphen
    return false;
  });

  return problematic;
}

async function main() {
  const dryRun = !process.argv.includes('--fix');

  console.log('='.repeat(60));
  console.log('Fitness Instagram Slug Fixer');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (use --fix to apply changes)' : 'FIXING'}\n`);

  const problematic = await findProblematicSlugs();

  if (problematic.length === 0) {
    console.log('No problematic slugs found. All fitness places have valid slugs.');
    return;
  }

  console.log(`Found ${problematic.length} fitness places with problematic slugs:\n`);

  for (const fp of problematic) {
    const newSlug = generateSlug(fp.name, fp.id);
    console.log(`  ID: ${fp.id}`);
    console.log(`  Name: ${fp.name}`);
    console.log(`  Current slug: ${fp.slug || '(empty)'}`);
    console.log(`  New slug: ${newSlug}`);
    console.log(`  Instagram: ${fp.instagram || '(none)'}`);
    console.log('');

    if (!dryRun) {
      // Check if new slug already exists
      const { data: existing } = await supabase
        .from('fitness_places')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', fp.id)
        .single();

      if (existing) {
        // Add a suffix to make it unique
        const uniqueSlug = `${newSlug}-${fp.id.slice(0, 8)}`;
        console.log(`  (!) Slug collision - using: ${uniqueSlug}`);

        const { error: updateError } = await supabase
          .from('fitness_places')
          .update({ slug: uniqueSlug })
          .eq('id', fp.id);

        if (updateError) {
          console.error(`  ERROR updating: ${updateError.message}`);
        } else {
          console.log(`  UPDATED successfully`);
        }
      } else {
        const { error: updateError } = await supabase
          .from('fitness_places')
          .update({ slug: newSlug })
          .eq('id', fp.id);

        if (updateError) {
          console.error(`  ERROR updating: ${updateError.message}`);
        } else {
          console.log(`  UPDATED successfully`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  if (dryRun) {
    console.log('DRY RUN complete. Run with --fix to apply changes:');
    console.log('  node bin/fix-fitness-instagram-slugs.js --fix');
  } else {
    console.log(`Fixed ${problematic.length} fitness place slugs.`);
    console.log('Remember to deploy to Vercel for changes to take effect on the live site.');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
