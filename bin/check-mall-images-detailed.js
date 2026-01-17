#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDetailedImages() {
  console.log('🔍 Detailed Mall Images Check');
  console.log('='.repeat(80));

  // Get all folders
  const { data: folders } = await supabase
    .storage
    .from('malls')
    .list('', { limit: 100 });

  console.log(`Found ${folders.length} mall folders\n`);

  let totalImages = 0;
  const mallDetails = [];

  for (const folder of folders) {
    // List all files recursively in this folder
    const { data: files } = await supabase
      .storage
      .from('malls')
      .list(folder.name, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    // Filter only image files (not subdirectories)
    const imageFiles = files?.filter(f =>
      f.name.endsWith('.jpg') ||
      f.name.endsWith('.jpeg') ||
      f.name.endsWith('.png') ||
      f.name.endsWith('.webp')
    ) || [];

    totalImages += imageFiles.length;

    mallDetails.push({
      folder: folder.name,
      imageCount: imageFiles.length,
      files: imageFiles.slice(0, 5) // First 5 for preview
    });

    // Check database for this mall
    const { count: dbCount } = await supabase
      .from('mall_images')
      .select('id', { count: 'exact', head: true })
      .like('url', `%${folder.name}%`);

    mallDetails[mallDetails.length - 1].dbCount = dbCount || 0;
  }

  // Sort by image count descending
  mallDetails.sort((a, b) => b.imageCount - a.imageCount);

  console.log('Mall Images Status:');
  console.log('='.repeat(80));

  mallDetails.forEach(mall => {
    const status = mall.dbCount === mall.imageCount ? '✅' :
                   mall.dbCount === 0 ? '❌' : '⚠️ ';
    console.log(`${status} ${mall.folder.padEnd(50)} - ${mall.imageCount} in storage, ${mall.dbCount} in DB`);

    // Show sample filenames
    if (mall.imageCount > 0) {
      const samples = mall.files.slice(0, 3);
      samples.forEach(f => {
        console.log(`      ${f.name}`);
      });
      if (mall.imageCount > 3) {
        console.log(`      ... and ${mall.imageCount - 3} more`);
      }
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY:');
  console.log(`Total malls: ${mallDetails.length}`);
  console.log(`Total images in storage: ${totalImages}`);
  console.log(`Malls missing from DB: ${mallDetails.filter(m => m.dbCount === 0).length}`);
  console.log(`Malls with mismatched counts: ${mallDetails.filter(m => m.dbCount !== m.imageCount && m.dbCount > 0).length}`);
  console.log(`Malls perfectly synced: ${mallDetails.filter(m => m.dbCount === m.imageCount && m.imageCount > 0).length}`);
}

checkDetailedImages().catch(console.error);