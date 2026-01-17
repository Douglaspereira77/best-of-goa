/**
 * Cleanup Broken Fitness Image Records
 *
 * Removes database records in fitness_images that point to non-existent storage files.
 *
 * Usage:
 *   node scripts/cleanup-broken-fitness-images.js --dry-run    # Preview
 *   node scripts/cleanup-broken-fitness-images.js --execute    # Delete records
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, '🧹 CLEANUP BROKEN FITNESS IMAGE RECORDS');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    log(colors.yellow, '\n⚠️  DRY RUN MODE - No changes will be made\n');
  } else {
    log(colors.red, '\n🔴 EXECUTE MODE - Records will be deleted!\n');
  }

  // Get all fitness_images records (need to paginate since Supabase has 1000 row limit)
  let allImages = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: batch, error: batchError } = await supabase
      .from('fitness_images')
      .select('id, url, fitness_place_id')
      .range(offset, offset + pageSize - 1);

    if (batchError) {
      throw new Error(`Failed to fetch images: ${batchError.message}`);
    }

    if (!batch || batch.length === 0) break;

    allImages = allImages.concat(batch);
    offset += pageSize;

    if (batch.length < pageSize) break; // No more records
  }

  const images = allImages;
  const error = null;

  if (error) {
    throw new Error(`Failed to fetch images: ${error.message}`);
  }

  log(colors.blue, `Total fitness_images records: ${images.length}`);

  // Check each URL
  const brokenRecords = [];
  let checked = 0;

  log(colors.cyan, '\nChecking image URLs...');

  for (const img of images) {
    try {
      const response = await fetch(img.url, { method: 'HEAD' });
      if (!response.ok) {
        brokenRecords.push(img);
      }
    } catch {
      brokenRecords.push(img);
    }

    checked++;
    if (checked % 50 === 0) {
      process.stdout.write(`\r  Checked ${checked}/${images.length}... (${brokenRecords.length} broken)`);
    }
  }

  console.log(`\r  Checked ${checked}/${images.length}... (${brokenRecords.length} broken)`);

  if (brokenRecords.length === 0) {
    log(colors.green, '\n✅ No broken records found!');
    return;
  }

  // Group by fitness_place_id to see affected places
  const byPlace = {};
  for (const rec of brokenRecords) {
    if (!byPlace[rec.fitness_place_id]) {
      byPlace[rec.fitness_place_id] = [];
    }
    byPlace[rec.fitness_place_id].push(rec);
  }

  log(colors.yellow, `\nBroken records by fitness place:`);
  const placeIds = Object.keys(byPlace);
  for (const placeId of placeIds.slice(0, 10)) {
    const count = byPlace[placeId].length;
    log(colors.red, `  - ${placeId}: ${count} broken images`);
  }
  if (placeIds.length > 10) {
    console.log(`  ... and ${placeIds.length - 10} more places`);
  }

  log(colors.yellow, `\nTotal broken records to delete: ${brokenRecords.length}`);
  log(colors.yellow, `Affected fitness places: ${placeIds.length}`);

  if (DRY_RUN) {
    log(colors.yellow, '\n⚠️  Run with --execute to delete these records');
    return;
  }

  // Delete broken records
  log(colors.cyan, '\nDeleting broken records...');

  const idsToDelete = brokenRecords.map(r => r.id);
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const { error: deleteError } = await supabase
      .from('fitness_images')
      .delete()
      .in('id', batch);

    if (deleteError) {
      log(colors.red, `Error deleting batch: ${deleteError.message}`);
    } else {
      deleted += batch.length;
    }

    process.stdout.write(`\r  Deleted ${deleted}/${idsToDelete.length}...`);
  }

  console.log();
  log(colors.green, `\n✅ Deleted ${deleted} broken image records`);

  // Check if any affected places now have no images - update hero_image if needed
  log(colors.cyan, '\nChecking for places that need hero_image cleanup...');

  for (const placeId of placeIds) {
    // Check if place still has images
    const { data: remaining } = await supabase
      .from('fitness_images')
      .select('id, url')
      .eq('fitness_place_id', placeId)
      .limit(1);

    if (!remaining || remaining.length === 0) {
      // No images left - clear hero_image
      await supabase
        .from('fitness_places')
        .update({ hero_image: null })
        .eq('id', placeId);
      log(colors.yellow, `  Cleared hero_image for place ${placeId} (no images remaining)`);
    } else {
      // Check if current hero_image is broken
      const { data: place } = await supabase
        .from('fitness_places')
        .select('hero_image')
        .eq('id', placeId)
        .single();

      if (place?.hero_image) {
        const isBroken = brokenRecords.some(r =>
          r.fitness_place_id === placeId && r.url === place.hero_image
        );

        if (isBroken) {
          // Update to first available image
          const { data: firstImage } = await supabase
            .from('fitness_images')
            .select('url')
            .eq('fitness_place_id', placeId)
            .order('display_order', { ascending: true })
            .limit(1)
            .single();

          if (firstImage) {
            await supabase
              .from('fitness_places')
              .update({ hero_image: firstImage.url })
              .eq('id', placeId);
            log(colors.green, `  Updated hero_image for place ${placeId}`);
          }
        }
      }
    }
  }

  log(colors.green, '\n✅ Cleanup complete!');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
