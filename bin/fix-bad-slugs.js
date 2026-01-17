/**
 * Fix bad slugs in fitness_places and schools tables
 *
 * Issues found from Ahrefs audit:
 * 1. Fitness places with Instagram handles as slugs (@keepfit.kw, @mpd_gym, etc.)
 * 2. School curriculum pages returning 404 (/places-to-learn/american, /british, etc.)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to create proper slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')  // Remove apostrophes
    .replace(/&/g, 'and')  // Replace & with and
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/-+/g, '-')  // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');  // Remove leading/trailing hyphens
}

async function findBadFitnessSlugs() {
  console.log('\n=== CHECKING FITNESS PLACES FOR BAD SLUGS ===\n');

  // Get ALL fitness places to check for bad patterns
  const { data: allFitness, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, instagram')
    .order('name');

  if (error) {
    console.error('Error fetching fitness places:', error);
    return [];
  }

  // Filter for bad slug patterns
  const badSlugs = (allFitness || []).filter(fp => {
    if (!fp.slug) return true; // Empty slug
    if (fp.slug.startsWith('-')) return true; // Leading hyphen
    if (fp.slug.startsWith('@')) return true; // @ handle
    if (fp.slug.includes('@')) return true; // Contains @
    if (fp.slug.includes('%')) return true; // URL encoded
    if (fp.slug.includes(' ')) return true; // Contains spaces
    if (fp.slug.includes('(')) return true; // Contains parentheses
    if (/[A-Z]/.test(fp.slug)) return true; // Contains uppercase
    return false;
  });

  if (badSlugs.length === 0) {
    console.log('No bad fitness slugs found!');
  } else {
    console.log(`Found ${badSlugs.length} fitness places with bad slugs:\n`);
    badSlugs.forEach(fp => {
      const newSlug = createSlug(fp.name);
      console.log(`  ID: ${fp.id}`);
      console.log(`  Name: ${fp.name}`);
      console.log(`  Current Slug: ${fp.slug}`);
      console.log(`  Instagram: ${fp.instagram || 'N/A'}`);
      console.log(`  Suggested New Slug: ${newSlug}`);
      console.log('');
    });
  }

  return badSlugs;
}

async function fixFitnessSlugs(dryRun = true) {
  const badSlugs = await findBadFitnessSlugs();

  if (badSlugs.length === 0) return;

  console.log(`\n=== ${dryRun ? 'DRY RUN - ' : ''}FIXING FITNESS SLUGS ===\n`);

  for (const fp of badSlugs) {
    const newSlug = createSlug(fp.name);

    // Check if newSlug already exists
    const { data: existing } = await supabase
      .from('fitness_places')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', fp.id)
      .single();

    if (existing) {
      console.log(`⚠️  Slug conflict for "${fp.name}": "${newSlug}" already exists. Appending suffix.`);
      // Add a suffix
      const slugWithSuffix = `${newSlug}-${fp.id.substring(0, 8)}`;

      if (!dryRun) {
        const { error } = await supabase
          .from('fitness_places')
          .update({ slug: slugWithSuffix })
          .eq('id', fp.id);

        if (error) {
          console.error(`❌ Failed to update ${fp.name}:`, error);
        } else {
          console.log(`✅ Fixed: "${fp.slug}" → "${slugWithSuffix}"`);
        }
      } else {
        console.log(`Would change: "${fp.slug}" → "${slugWithSuffix}"`);
      }
    } else {
      if (!dryRun) {
        const { error } = await supabase
          .from('fitness_places')
          .update({ slug: newSlug })
          .eq('id', fp.id);

        if (error) {
          console.error(`❌ Failed to update ${fp.name}:`, error);
        } else {
          console.log(`✅ Fixed: "${fp.slug}" → "${newSlug}"`);
        }
      } else {
        console.log(`Would change: "${fp.slug}" → "${newSlug}"`);
      }
    }
  }
}

async function checkSchoolCurriculumLinks() {
  console.log('\n=== CHECKING SCHOOL CURRICULUM LINKS ===\n');

  // The 404 pages are:
  // /places-to-learn/american
  // /places-to-learn/british
  // /places-to-learn/indian
  // /places-to-learn/international
  // /places-to-learn/ib
  // /places-to-learn/national

  // These should NOT exist as standalone pages - they should be query params:
  // /places-to-learn?category=american

  // Let's check if there's any code generating these links
  console.log('Expected URL pattern: /places-to-learn?category=<curriculum>');
  console.log('Invalid URLs found in Ahrefs:');
  console.log('  - /places-to-learn/american (should be ?category=american)');
  console.log('  - /places-to-learn/british (should be ?category=british)');
  console.log('  - /places-to-learn/indian (should be ?category=indian)');
  console.log('  - /places-to-learn/international (should be ?category=international)');
  console.log('  - /places-to-learn/ib (should be ?category=ib)');
  console.log('  - /places-to-learn/national (should be ?category=national)');
  console.log('\nThese links are being generated somewhere in the codebase or are old crawled URLs.');
  console.log('A redirect or catch-all route should handle these.');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          FIX BAD SLUGS - AHREFS 404 AUDIT                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  await findBadFitnessSlugs();
  await checkSchoolCurriculumLinks();

  if (shouldFix) {
    console.log('\n⚠️  Running in FIX mode - will update database!\n');
    await fixFitnessSlugs(false);
  } else {
    console.log('\n💡 Run with --fix flag to apply changes to database');
  }
}

main().catch(console.error);
