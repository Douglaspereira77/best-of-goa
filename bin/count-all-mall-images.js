#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countAllImages() {
  console.log('📊 Complete Mall Images Inventory');
  console.log('='.repeat(80));

  const { data: folders } = await supabase.storage.from('malls').list('');

  let totalImages = 0;
  const results = [];

  for (const folder of folders) {
    // Check for images subfolder
    const { data: images } = await supabase
      .storage
      .from('malls')
      .list(`${folder.name}/images`);

    const imageCount = images?.filter(f =>
      f.name.endsWith('.jpg') ||
      f.name.endsWith('.jpeg') ||
      f.name.endsWith('.png') ||
      f.name.endsWith('.webp')
    ).length || 0;

    // Check DB
    const { count: dbCount } = await supabase
      .from('mall_images')
      .select('id', { count: 'exact', head: true })
      .like('url', `%${folder.name}%`);

    totalImages += imageCount;
    results.push({
      name: folder.name,
      storage: imageCount,
      database: dbCount || 0
    });
  }

  // Sort by storage count
  results.sort((a, b) => b.storage - a.storage);

  results.forEach(r => {
    const status = r.database === r.storage && r.storage > 0 ? '✅' :
                   r.database === 0 && r.storage > 0 ? '❌' :
                   r.database !== r.storage ? '⚠️ ' : '⚪';
    console.log(`${status} ${r.name.padEnd(50)} ${r.storage} in storage, ${r.database} in DB`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total malls: ${results.length}`);
  console.log(`Total images in storage: ${totalImages}`);
  console.log(`Total images in database: ${results.reduce((sum, r) => sum + r.database, 0)}`);
  console.log(`Malls with images in storage: ${results.filter(r => r.storage > 0).length}`);
  console.log(`Malls missing from DB: ${results.filter(r => r.storage > 0 && r.database === 0).length}`);
  console.log(`Perfectly synced: ${results.filter(r => r.storage === r.database && r.storage > 0).length}`);
}

countAllImages().catch(console.error);