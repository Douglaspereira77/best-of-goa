/**
 * Fitness Image Deduplication Script
 *
 * Identifies and removes duplicate images from the fitness storage bucket
 * while updating database references to point to the "keeper" file.
 *
 * Duplicates are identified by file size (identical size = duplicate)
 *
 * Usage:
 *   node scripts/dedupe-fitness-images.js --dry-run    # Preview changes
 *   node scripts/dedupe-fitness-images.js --execute    # Actually delete
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = 'fitness';
const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

// Colors for console output
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
  log(colors.bright + colors.cyan, '🏋️ FITNESS IMAGE DEDUPLICATION');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    log(colors.yellow, '\n⚠️  DRY RUN MODE - No changes will be made');
    log(colors.yellow, '   Run with --execute to actually delete duplicates\n');
  } else {
    log(colors.red, '\n🔴 EXECUTE MODE - Changes will be permanent!\n');
  }

  // Phase 1: Audit
  log(colors.bright, '\n📊 PHASE 1: Audit & Analysis');
  console.log('-'.repeat(40));

  const allFiles = await listAllFiles();
  log(colors.blue, `Total files in bucket: ${allFiles.length}`);

  // Group files by size
  const sizeGroups = groupBySize(allFiles);
  const duplicateClusters = Object.entries(sizeGroups).filter(([_, files]) => files.length > 1);

  log(colors.blue, `Unique file sizes: ${Object.keys(sizeGroups).length}`);
  log(colors.yellow, `Duplicate clusters found: ${duplicateClusters.length}`);

  // Calculate stats
  let totalDuplicates = 0;
  let spaceToReclaim = 0;

  for (const [size, files] of duplicateClusters) {
    const dupeCount = files.length - 1; // Keep one
    totalDuplicates += dupeCount;
    spaceToReclaim += parseInt(size) * dupeCount;
  }

  log(colors.red, `Total duplicate files: ${totalDuplicates}`);
  log(colors.green, `Space to reclaim: ${formatBytes(spaceToReclaim)}`);

  if (duplicateClusters.length === 0) {
    log(colors.green, '\n✅ No duplicates found! Bucket is clean.');
    return;
  }

  // Phase 2: Build Dedup Map
  log(colors.bright, '\n🗺️  PHASE 2: Build Dedup Map');
  console.log('-'.repeat(40));

  const dedupMap = buildDedupMap(duplicateClusters);

  // Show sample mappings
  console.log('\nSample mappings (first 5):');
  const mapEntries = Object.entries(dedupMap);
  for (let i = 0; i < Math.min(5, mapEntries.length); i++) {
    const [duplicate, keeper] = mapEntries[i];
    log(colors.red, `  ❌ ${duplicate}`);
    log(colors.green, `  ✅ ${keeper}`);
    console.log();
  }

  // Save mapping to file for rollback reference
  const mappingJson = {
    timestamp: new Date().toISOString(),
    totalDuplicates,
    spaceToReclaim,
    mappings: dedupMap
  };

  const fs = require('fs');
  const mappingPath = `scripts/fitness-dedup-mapping-${Date.now()}.json`;
  fs.writeFileSync(mappingPath, JSON.stringify(mappingJson, null, 2));
  log(colors.cyan, `\n📁 Mapping saved to: ${mappingPath}`);

  // Phase 3: Update Database
  log(colors.bright, '\n🗄️  PHASE 3: Update Database References');
  console.log('-'.repeat(40));

  await updateDatabaseReferences(dedupMap);

  // Phase 4: Clean Storage
  log(colors.bright, '\n🗑️  PHASE 4: Clean Storage Bucket');
  console.log('-'.repeat(40));

  const duplicatePaths = Object.keys(dedupMap);

  if (DRY_RUN) {
    log(colors.yellow, `Would delete ${duplicatePaths.length} files:`);
    duplicatePaths.slice(0, 10).forEach(path => {
      log(colors.red, `  - ${path}`);
    });
    if (duplicatePaths.length > 10) {
      console.log(`  ... and ${duplicatePaths.length - 10} more`);
    }
  } else {
    await deleteFiles(duplicatePaths);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.green, '✅ DEDUPLICATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`
Summary:
  - Files analyzed: ${allFiles.length}
  - Duplicate clusters: ${duplicateClusters.length}
  - Files ${DRY_RUN ? 'to be ' : ''}removed: ${totalDuplicates}
  - Space ${DRY_RUN ? 'to be ' : ''}reclaimed: ${formatBytes(spaceToReclaim)}
  - Mapping saved: ${mappingPath}
  `);

  if (DRY_RUN) {
    log(colors.yellow, '⚠️  This was a DRY RUN. Run with --execute to apply changes.');
  }
}

/**
 * List all files in the fitness bucket recursively
 */
async function listAllFiles() {
  const allFiles = [];

  // First, list all folders (fitness place slugs)
  const { data: folders, error: folderError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 });

  if (folderError) {
    throw new Error(`Failed to list folders: ${folderError.message}`);
  }

  // For each folder, list files in /images subdirectory
  for (const folder of folders) {
    if (folder.id) continue; // Skip if it's a file, not a folder

    const imagesPath = `${folder.name}/images`;
    const { data: files, error: filesError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(imagesPath, { limit: 1000 });

    if (filesError) {
      console.warn(`Warning: Could not list ${imagesPath}: ${filesError.message}`);
      continue;
    }

    for (const file of files) {
      if (!file.id) continue; // Skip folders

      allFiles.push({
        name: file.name,
        path: `${imagesPath}/${file.name}`,
        size: file.metadata?.size || 0,
        folder: folder.name
      });
    }
  }

  return allFiles;
}

/**
 * Group files by their size
 */
function groupBySize(files) {
  const groups = {};

  for (const file of files) {
    const size = file.size.toString();
    if (!groups[size]) {
      groups[size] = [];
    }
    groups[size].push(file);
  }

  return groups;
}

/**
 * Build mapping of duplicate paths to keeper paths
 */
function buildDedupMap(duplicateClusters) {
  const dedupMap = {};

  for (const [size, files] of duplicateClusters) {
    // Sort alphabetically and pick first as keeper
    files.sort((a, b) => a.path.localeCompare(b.path));
    const keeper = files[0];

    // Map all others to the keeper
    for (let i = 1; i < files.length; i++) {
      dedupMap[files[i].path] = keeper.path;
    }
  }

  return dedupMap;
}

/**
 * Update database references from duplicate URLs to keeper URLs
 */
async function updateDatabaseReferences(dedupMap) {
  const baseUrl = process.env.SUPABASE_URL + '/storage/v1/object/public/fitness/';

  // Build URL mapping
  const urlMap = {};
  for (const [dupePath, keeperPath] of Object.entries(dedupMap)) {
    const dupeUrl = baseUrl + dupePath;
    const keeperUrl = baseUrl + keeperPath;
    urlMap[dupeUrl] = keeperUrl;
  }

  // Get all fitness_images records
  const { data: images, error: imagesError } = await supabase
    .from('fitness_images')
    .select('id, url, fitness_place_id');

  if (imagesError) {
    throw new Error(`Failed to fetch fitness_images: ${imagesError.message}`);
  }

  log(colors.blue, `Found ${images.length} image records in database`);

  // Find records that need updating
  const toUpdate = [];
  const toDelete = []; // Records pointing to duplicates of the same keeper

  // Group by fitness_place_id to detect duplicate entries
  const byPlace = {};
  for (const img of images) {
    if (!byPlace[img.fitness_place_id]) {
      byPlace[img.fitness_place_id] = [];
    }
    byPlace[img.fitness_place_id].push(img);
  }

  // For each place, identify duplicates
  for (const [placeId, placeImages] of Object.entries(byPlace)) {
    const seenUrls = new Set();

    for (const img of placeImages) {
      // Check if this URL is a duplicate that maps to a keeper
      const keeperUrl = urlMap[img.url] || img.url;

      if (seenUrls.has(keeperUrl)) {
        // This is a duplicate entry - mark for deletion
        toDelete.push(img.id);
      } else {
        seenUrls.add(keeperUrl);

        // If URL changed, mark for update
        if (urlMap[img.url]) {
          toUpdate.push({ id: img.id, newUrl: keeperUrl });
        }
      }
    }
  }

  log(colors.yellow, `Records to update: ${toUpdate.length}`);
  log(colors.red, `Duplicate records to delete: ${toDelete.length}`);

  if (DRY_RUN) {
    console.log('\nWould update these records:');
    toUpdate.slice(0, 5).forEach(u => {
      console.log(`  ID ${u.id} -> ${u.newUrl.split('/').pop()}`);
    });
    if (toUpdate.length > 5) console.log(`  ... and ${toUpdate.length - 5} more`);

    console.log('\nWould delete these duplicate records:');
    console.log(`  IDs: ${toDelete.slice(0, 10).join(', ')}${toDelete.length > 10 ? '...' : ''}`);
  } else {
    // Perform updates
    for (const { id, newUrl } of toUpdate) {
      const { error } = await supabase
        .from('fitness_images')
        .update({ url: newUrl })
        .eq('id', id);

      if (error) {
        console.warn(`Warning: Failed to update record ${id}: ${error.message}`);
      }
    }
    log(colors.green, `✅ Updated ${toUpdate.length} records`);

    // Delete duplicate entries
    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('fitness_images')
        .delete()
        .in('id', toDelete);

      if (error) {
        console.warn(`Warning: Failed to delete duplicate records: ${error.message}`);
      } else {
        log(colors.green, `✅ Deleted ${toDelete.length} duplicate records`);
      }
    }
  }

  // Update hero_image references in fitness_places
  const { data: places, error: placesError } = await supabase
    .from('fitness_places')
    .select('id, hero_image');

  if (placesError) {
    throw new Error(`Failed to fetch fitness_places: ${placesError.message}`);
  }

  let heroUpdates = 0;
  for (const place of places) {
    if (place.hero_image && urlMap[place.hero_image]) {
      if (!DRY_RUN) {
        await supabase
          .from('fitness_places')
          .update({ hero_image: urlMap[place.hero_image] })
          .eq('id', place.id);
      }
      heroUpdates++;
    }
  }

  if (heroUpdates > 0) {
    log(colors.yellow, `Hero image references ${DRY_RUN ? 'to update' : 'updated'}: ${heroUpdates}`);
  }
}

/**
 * Delete files from storage
 */
async function deleteFiles(paths) {
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(batch);

    if (error) {
      console.warn(`Warning: Failed to delete batch: ${error.message}`);
    } else {
      deleted += batch.length;
      process.stdout.write(`\r  Deleted ${deleted}/${paths.length} files...`);
    }
  }

  console.log();
  log(colors.green, `✅ Deleted ${deleted} files from storage`);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run
main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
