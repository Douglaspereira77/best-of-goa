/**
 * Check Supabase Storage bucket for Al-Bayan images
 * and verify why photos field isn't being populated
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorageBucket() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🗄️  SUPABASE STORAGE BUCKET CHECK');
  console.log('═══════════════════════════════════════════════════════\n');

  const schoolId = 'ce3f0b50-a9b1-493b-98ca-e4522436174d';

  // Check schools bucket for Al-Bayan folder
  console.log('📁 Checking "schools" bucket...\n');

  try {
    // List files in schools bucket under the school ID folder
    const { data: files, error } = await supabase
      .storage
      .from('schools')
      .list(schoolId, { limit: 100 });

    if (error) {
      console.error('❌ Error accessing bucket:', error);
      return;
    }

    if (!files || files.length === 0) {
      console.log('⚠️  No files found in schools bucket for this school');

      // Try listing root to see what's there
      const { data: rootFiles } = await supabase
        .storage
        .from('schools')
        .list('', { limit: 20 });

      if (rootFiles && rootFiles.length > 0) {
        console.log('\nRoot folders/files in schools bucket:');
        rootFiles.forEach(f => {
          console.log(`  - ${f.name} (${f.metadata?.size || 0} bytes)`);
        });
      }

      return;
    }

    console.log(`✅ Found ${files.length} files in schools/${schoolId}/\n`);

    // List all files with details
    console.log('Files:');
    files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.name}`);
      console.log(`   Size: ${(file.metadata?.size || 0) / 1024} KB`);
      console.log(`   Last Modified: ${file.updated_at || file.created_at}\n`);
    });

    // Generate public URLs for these files
    console.log('\n📸 Generating public URLs...\n');

    const imageUrls: string[] = [];
    for (const file of files.slice(0, 5)) {
      const { data: urlData } = supabase
        .storage
        .from('schools')
        .getPublicUrl(`${schoolId}/${file.name}`);

      if (urlData?.publicUrl) {
        imageUrls.push(urlData.publicUrl);
        console.log(`✅ ${file.name}`);
        console.log(`   ${urlData.publicUrl}\n`);
      }
    }

    // Now check the database field
    console.log('\n💾 Checking database photos field...\n');

    const { data: school } = await supabase
      .from('schools')
      .select('name, photos, hero_image, main_image')
      .eq('id', schoolId)
      .single();

    if (school) {
      console.log(`School: ${school.name}`);
      console.log(`photos field: ${school.photos ? JSON.stringify(school.photos).substring(0, 100) : 'NULL'}`);
      console.log(`hero_image: ${school.hero_image || 'NULL'}`);
      console.log(`main_image: ${school.main_image || 'NULL'}`);
    }

    // If photos is NULL but files exist, let's update it manually
    if (files.length > 0 && !school?.photos) {
      console.log('\n⚠️  ISSUE DETECTED:');
      console.log(`   - ${files.length} images in storage bucket ✅`);
      console.log(`   - photos field in database: NULL ❌`);
      console.log('\n   This means the database update step failed during extraction.\n');

      console.log('Would you like me to fix this by updating the photos field? (Y/n)');
      console.log('\nTo fix manually, run:');
      console.log(`UPDATE schools SET photos = '${JSON.stringify(imageUrls)}' WHERE id = '${schoolId}';`);
    }

  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

checkStorageBucket()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
