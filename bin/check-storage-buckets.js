#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStorageBucket() {
  console.log('🗂️  Checking malls storage bucket...');
  console.log('='.repeat(60));

  // List all files in malls bucket
  const { data: files, error } = await supabase
    .storage
    .from('malls')
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('Error listing files:', error);
    return;
  }

  console.log(`Total files in malls bucket: ${files?.length || 0}\n`);

  if (files && files.length > 0) {
    // Group by folder (slug)
    const folders = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length > 1) {
        const folder = parts[0];
        if (!folders[folder]) folders[folder] = [];
        folders[folder].push(file.name);
      }
    });

    console.log(`Malls with images in storage:`);
    for (const [folder, images] of Object.entries(folders)) {
      console.log(`  ${folder}: ${images.length} images`);
    }

    // Now check which ones are in the database
    console.log('\n' + '='.repeat(60));
    console.log('Storage vs Database Comparison:');
    console.log('='.repeat(60));

    let mismatches = 0;

    for (const folder of Object.keys(folders).sort()) {
      const { count } = await supabase
        .from('mall_images')
        .select('id', { count: 'exact', head: true })
        .like('url', `%${folder}%`);

      const inStorage = folders[folder].length;
      const inDB = count || 0;

      if (inDB === 0 && inStorage > 0) {
        console.log(`❌ ${folder.padEnd(45)} - ${inStorage} in storage, 0 in DB`);
        mismatches++;
      } else if (inDB !== inStorage) {
        console.log(`⚠️  ${folder.padEnd(45)} - ${inStorage} in storage, ${inDB} in DB`);
        mismatches++;
      } else {
        console.log(`✅ ${folder.padEnd(45)} - ${inStorage} in storage, ${inDB} in DB`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`Total mall folders: ${Object.keys(folders).length}`);
    console.log(`Mismatches: ${mismatches}`);
    console.log(`Perfectly synced: ${Object.keys(folders).length - mismatches}`);
  } else {
    console.log('❌ No files found in malls bucket');
  }
}

checkStorageBucket().catch(console.error);