#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFolders() {
  const { data: folders } = await supabase
    .storage
    .from('malls')
    .list('', { limit: 50 });

  console.log('Checking mall folders in storage...');
  console.log('='.repeat(60));

  let totalImages = 0;
  const results = [];

  for (const folder of folders) {
    const { data: images } = await supabase
      .storage
      .from('malls')
      .list(folder.name, { limit: 100 });

    const imageCount = images?.length || 0;
    totalImages += imageCount;

    results.push({ folder: folder.name, count: imageCount });
  }

  // Sort by count descending
  results.sort((a, b) => b.count - a.count);

  results.forEach(r => {
    if (r.count > 0) {
      console.log(`✅ ${r.folder.padEnd(50)} - ${r.count} images`);
    } else {
      console.log(`❌ ${r.folder.padEnd(50)} - 0 images`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total folders: ${folders.length}`);
  console.log(`Total images: ${totalImages}`);
  console.log(`Average per folder: ${(totalImages/folders.length).toFixed(1)}`);
}

checkFolders().catch(console.error);