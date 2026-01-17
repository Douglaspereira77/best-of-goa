#!/usr/bin/env node

/**
 * Delete Incomplete Restaurants
 *
 * Deletes restaurants identified as having no useful data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteIncompleteRestaurants() {
  console.log('🗑️  DELETING INCOMPLETE RESTAURANTS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Read the deletion list
  if (!fs.existsSync('bin/incomplete-to-delete.json')) {
    console.error('❌ No deletion list found. Run find-incomplete-restaurants.js first.\n');
    return;
  }

  const deletionList = JSON.parse(fs.readFileSync('bin/incomplete-to-delete.json', 'utf8'));

  console.log(`📊 Found ${deletionList.count} restaurants to delete\n`);

  if (deletionList.count === 0) {
    console.log('✅ Nothing to delete!\n');
    return;
  }

  // Extract IDs
  const idsToDelete = deletionList.restaurants.map(r => r.id);

  console.log('🔍 Restaurants to be deleted:\n');
  deletionList.restaurants.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.name} (${r.slug})`);
  });

  console.log('\n' + '─'.repeat(100));
  console.log('\n⚠️  PROCEEDING WITH DELETION...\n');

  // Delete in batches of 10
  const BATCH_SIZE = 10;
  let totalDeleted = 0;
  let errors = [];

  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(idsToDelete.length / BATCH_SIZE);

    console.log(`📦 Deleting batch ${batchNum}/${totalBatches} (${batch.length} restaurants)...`);

    const { data, error } = await supabase
      .from('restaurants')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`   ❌ Batch ${batchNum} error:`, error.message);
      errors.push({ batch: batchNum, error: error.message });
    } else {
      totalDeleted += batch.length;
      console.log(`   ✅ Batch ${batchNum} deleted successfully (${batch.length} restaurants)`);
    }

    // Small delay between batches
    if (i + BATCH_SIZE < idsToDelete.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '═'.repeat(100));
  console.log('📊 DELETION COMPLETE');
  console.log('═'.repeat(100));
  console.log(`Total Attempted: ${deletionList.count}`);
  console.log(`Successfully Deleted: ${totalDeleted} ✅`);
  console.log(`Errors: ${errors.length} ❌`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:\n');
    errors.forEach(e => {
      console.log(`   Batch ${e.batch}: ${e.error}`);
    });
  }

  console.log('═'.repeat(100) + '\n');

  // Archive the deletion list
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.renameSync(
    'bin/incomplete-to-delete.json',
    `bin/deleted-${timestamp}.json`
  );

  console.log(`💾 Deletion log archived to: bin/deleted-${timestamp}.json\n`);
}

deleteIncompleteRestaurants().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
