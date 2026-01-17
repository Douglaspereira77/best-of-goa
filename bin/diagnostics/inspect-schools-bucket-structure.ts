#!/usr/bin/env ts-node
/**
 * Inspect Schools Storage Bucket Structure
 *
 * Checks for:
 * 1. All top-level folders in the schools bucket
 * 2. Any "schools/schools" double-path issues
 * 3. Folder structure validation
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FolderInfo {
  name: string;
  hasImagesFolder: boolean;
  imageCount: number;
  samplePath?: string;
}

async function inspectSchoolsBucket() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 SCHOOLS BUCKET STRUCTURE INSPECTION');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: List root level of schools bucket
    console.log('📁 Listing root-level folders in "schools" bucket...\n');

    const { data: rootItems, error: rootError } = await supabase
      .storage
      .from('schools')
      .list('', { limit: 100 });

    if (rootError) {
      console.error('❌ Error accessing schools bucket:', rootError);
      return;
    }

    if (!rootItems || rootItems.length === 0) {
      console.log('⚠️  Schools bucket is empty - no folders found\n');
      return;
    }

    console.log(`✅ Found ${rootItems.length} root-level items\n`);
    console.log('Root Structure:');
    console.log('─'.repeat(60));

    const folders: FolderInfo[] = [];

    for (const item of rootItems) {
      // Check if this is the problematic "schools" subfolder
      if (item.name === 'schools') {
        console.log(`\n⚠️  PROBLEM DETECTED: "schools" subfolder exists!`);
        console.log(`   This would create double-path: schools/schools/[slug]`);
        console.log(`   Investigating this folder...\n`);

        // List what's inside the problematic "schools" subfolder
        const { data: nestedItems } = await supabase
          .storage
          .from('schools')
          .list('schools', { limit: 100 });

        if (nestedItems && nestedItems.length > 0) {
          console.log(`   Found ${nestedItems.length} items inside "schools/schools/":`);
          nestedItems.forEach(nested => {
            console.log(`   - schools/schools/${nested.name}`);
          });
          console.log('');
        }
      }

      // Check if it's a school folder (has images subfolder)
      const { data: subItems } = await supabase
        .storage
        .from('schools')
        .list(item.name, { limit: 10 });

      const hasImagesFolder = subItems?.some(sub => sub.name === 'images') || false;
      let imageCount = 0;
      let samplePath = undefined;

      if (hasImagesFolder) {
        // Count images
        const { data: images } = await supabase
          .storage
          .from('schools')
          .list(`${item.name}/images`, { limit: 100 });

        imageCount = images?.length || 0;

        if (images && images.length > 0) {
          samplePath = `schools/${item.name}/images/${images[0].name}`;
        }
      }

      folders.push({
        name: item.name,
        hasImagesFolder,
        imageCount,
        samplePath
      });

      // Display folder info
      const icon = hasImagesFolder ? '📚' : '📁';
      console.log(`${icon} ${item.name}/`);
      if (hasImagesFolder) {
        console.log(`   └─ images/ (${imageCount} files)`);
        if (samplePath) {
          console.log(`      Sample: ${samplePath}`);
        }
      }
      console.log('');
    }

    // Step 2: Summary
    console.log('─'.repeat(60));
    console.log('\n📊 SUMMARY:\n');

    const schoolFolders = folders.filter(f => f.hasImagesFolder);
    const otherFolders = folders.filter(f => !f.hasImagesFolder);
    const problemFolder = folders.find(f => f.name === 'schools');

    console.log(`Total folders: ${folders.length}`);
    console.log(`School folders (with images/): ${schoolFolders.length}`);
    console.log(`Other folders: ${otherFolders.length}`);
    console.log(`Total images: ${folders.reduce((sum, f) => sum + f.imageCount, 0)}`);

    if (problemFolder) {
      console.log(`\n❌ ISSUE: Double-path "schools" subfolder exists!`);
      console.log(`   This needs to be cleaned up before bulk extraction.\n`);
    } else {
      console.log(`\n✅ No double-path issues detected!`);
      console.log(`   Bucket structure looks correct.\n`);
    }

    // Step 3: Display correct structure
    console.log('─'.repeat(60));
    console.log('\n✅ CORRECT BUCKET STRUCTURE:\n');
    console.log('schools/ (bucket)');
    console.log('  ├─ gba-gulf-british-academy/');
    console.log('  │   └─ images/');
    console.log('  │       ├─ image-1.jpg');
    console.log('  │       └─ image-2.jpg');
    console.log('  ├─ al-bayan-bilingual-school/');
    console.log('  │   └─ images/');
    console.log('  └─ ...\n');

    console.log('❌ INCORRECT (double-path issue):');
    console.log('schools/ (bucket)');
    console.log('  └─ schools/ ← WRONG!');
    console.log('      └─ gba-gulf-british-academy/');
    console.log('          └─ images/\n');

  } catch (error) {
    console.error('❌ Inspection failed:', error);
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

inspectSchoolsBucket()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
