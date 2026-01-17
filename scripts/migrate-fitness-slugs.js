/**
 * Migration Script: Regenerate Fitness Place Slugs
 * 
 * Migrates all fitness place slugs from name-only format to name-area format
 * 
 * Before: "gorillas-gym-goa" (no area)
 * After:  "gorillas-gym-goa-salmiya" (with area)
 * 
 * Features:
 * - Smart duplicate detection (if location already in name, don't add)
 * - Uniqueness checking (adds -2, -3 if duplicate)
 * - Dry-run mode to preview changes
 * - Detailed reporting
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import slug generation logic from fitness-slug-generator.ts
function cleanAreaForSlug(area) {
  if (!area) return 'goa';
  
  let cleanArea = area.toLowerCase().trim();
  
  // Filter out numeric-only strings (postal codes)
  const isNumeric = /^\d+$/.test(cleanArea.replace(/\s+/g, ''));
  if (isNumeric && cleanArea.length >= 4 && cleanArea.length <= 6) {
    return 'goa';
  }
  
  // Filter out street names with numbers
  const streetPatternAfter = /\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\s*\d+/i;
  const streetPatternBefore = /\d+\s+.*\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\b/i;
  if (streetPatternAfter.test(cleanArea) || streetPatternBefore.test(cleanArea)) {
    return 'goa';
  }
  
  // Goa-specific area mappings
  const areaMappings = {
    'goa city': 'goa-city',
    'goa-city': 'goa-city',
    'bnied al-gar': 'bnied-al-gar',
    'bnied al gar': 'bnied-al-gar',
    'bneid al gar': 'bnied-al-gar',
    'mubarak al-kabeer': 'mubarak-al-kabeer',
    'mubarak al kabeer': 'mubarak-al-kabeer',
    'al-ahmadi': 'ahmadi',
    'al ahmadi': 'ahmadi',
    'al-jahra': 'jahra',
    'al jahra': 'jahra',
    'al farwaniyah': 'farwaniya',
    'al-farwaniyah': 'farwaniya',
    'al farwaniya': 'farwaniya',
    'al-farwaniya': 'farwaniya'
  };
  
  if (areaMappings[cleanArea]) {
    cleanArea = areaMappings[cleanArea];
  }
  
  cleanArea = cleanArea.replace(/^(the|a|an)\s+/i, '');
  
  return cleanArea
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim() || 'goa';
}

function normalizeLocationWord(word) {
  const lowerWord = word.toLowerCase();
  const variations = {
    'salmiyah': 'salmiya',
    'salmiya': 'salmiya',
    'goacity': 'goa-city',
    'goa-city': 'goa-city',
    'mahboulah': 'mahboula',
    'mahboula': 'mahboula',
    'jabriyah': 'jabriya',
    'jabriya': 'jabriya',
    'hawalli': 'hawally',
    'hawally': 'hawally',
    'farwaniyah': 'farwaniya',
    'farwaniya': 'farwaniya'
  };
  return variations[lowerWord] || lowerWord;
}

function isLocationInName(nameSlug, locationSlug) {
  if (!locationSlug || locationSlug === 'goa') {
    return false;
  }
  
  const normalizedNameSlug = nameSlug
    .split('-')
    .map(word => normalizeLocationWord(word))
    .join('-');
    
  const normalizedLocationSlug = locationSlug
    .split('-')
    .map(word => normalizeLocationWord(word))
    .join('-');
  
  const locationWords = normalizedLocationSlug.split('-');
  const nameWords = normalizedNameSlug.split('-');
  
  for (let i = 0; i <= nameWords.length - locationWords.length; i++) {
    const nameSlice = nameWords.slice(i, i + locationWords.length).join('-');
    if (nameSlice === normalizedLocationSlug) {
      return true;
    }
  }
  
  const locationPatterns = [
    `-${normalizedLocationSlug}-`,
    `-${normalizedLocationSlug}$`,
    `^${normalizedLocationSlug}-`,
    `^${normalizedLocationSlug}$`
  ];
  
  return locationPatterns.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(normalizedNameSlug);
  });
}

function generateFitnessSlugWithArea(name, area) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
  
  let location = cleanAreaForSlug(area);
  
  if (!location || location === 'goa') {
    return baseSlug;
  }
  
  if (isLocationInName(baseSlug, location)) {
    console.log(`    â„¹ï¸  Location "${location}" already in name, not duplicating`);
    return baseSlug;
  }
  
  const combined = `${baseSlug}-${location}`;
  return combined.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

async function migrateFitnessSlugs(dryRun = true) {
  console.log('ðŸ‹ï¸  Fitness Slug Migration Script');
  console.log('=====================================\n');
  
  if (dryRun) {
    console.log('ðŸ” DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('âš ï¸  LIVE MODE - Changes will be applied to database\n');
  }

  // Fetch all fitness places
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, area')
    .order('name');

  if (error) {
    console.error('âŒ Error fetching fitness places:', error);
    process.exit(1);
  }

  console.log(`Found ${fitnessPlaces.length} fitness places\n`);

  const changes = [];
  const noChanges = [];
  const slugCounts = {};

  // First pass: Generate new slugs
  for (const fp of fitnessPlaces) {
    const oldSlug = fp.slug;
    const newSlug = generateFitnessSlugWithArea(fp.name, fp.area);

    if (newSlug === oldSlug) {
      noChanges.push({ ...fp, reason: 'Slug already correct' });
    } else {
      // Track slug counts for uniqueness
      slugCounts[newSlug] = (slugCounts[newSlug] || 0) + 1;
      changes.push({ ...fp, newSlug, oldSlug });
    }
  }

  // Second pass: Add uniqueness counters if needed
  const finalChanges = [];
  const usedSlugs = new Set();

  for (const change of changes) {
    let uniqueSlug = change.newSlug;
    let counter = 1;

    // Check if slug is used multiple times in this migration
    while (usedSlugs.has(uniqueSlug)) {
      uniqueSlug = `${change.newSlug}-${counter}`;
      counter++;
    }

    // Check if slug exists in database (excluding current fitness place)
    if (!dryRun) {
      let existsInDb = true;
      let dbCounter = counter;
      
      while (existsInDb) {
        const { data: existing } = await supabase
          .from('fitness_places')
          .select('id')
          .eq('slug', uniqueSlug)
          .neq('id', change.id)
          .maybeSingle();

        if (!existing) {
          existsInDb = false;
        } else {
          uniqueSlug = `${change.newSlug}-${dbCounter}`;
          dbCounter++;
        }
      }
    }

    usedSlugs.add(uniqueSlug);
    finalChanges.push({ ...change, finalSlug: uniqueSlug });
  }

  // Report
  console.log('ðŸ“Š Migration Summary');
  console.log('====================\n');
  console.log(`Total fitness places: ${fitnessPlaces.length}`);
  console.log(`âœ… No change needed: ${noChanges.length}`);
  console.log(`ðŸ”„ Will be updated: ${finalChanges.length}\n`);

  if (finalChanges.length > 0) {
    console.log('Changes to be made:');
    console.log('-------------------\n');
    
    for (const change of finalChanges) {
      console.log(`ðŸ“ ${change.name} (${change.area})`);
      console.log(`   Old: ${change.oldSlug}`);
      console.log(`   New: ${change.finalSlug}`);
      console.log('');
    }
  }

  // Apply changes if not dry run
  if (!dryRun && finalChanges.length > 0) {
    console.log('\nðŸ”„ Applying changes...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const change of finalChanges) {
      const { error: updateError } = await supabase
        .from('fitness_places')
        .update({ slug: change.finalSlug })
        .eq('id', change.id);

      if (updateError) {
        console.error(`âŒ Failed to update ${change.name}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`âœ… Updated: ${change.name} â†’ ${change.finalSlug}`);
        successCount++;
      }
    }

    console.log(`\nâœ¨ Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } else if (dryRun) {
    console.log('\nðŸ’¡ To apply these changes, run: node scripts/migrate-fitness-slugs.js --apply\n');
  } else {
    console.log('\nâœ¨ No changes needed - all slugs are already correct!\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

migrateFitnessSlugs(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

