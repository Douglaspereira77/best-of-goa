/**
 * List all Supabase Storage buckets and their contents
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllBuckets() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🗄️  ALL SUPABASE STORAGE BUCKETS');
  console.log('═══════════════════════════════════════════════════════\n');

  // List all buckets
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }

  if (!buckets || buckets.length === 0) {
    console.log('No buckets found');
    return;
  }

  console.log(`Found ${buckets.length} bucket(s):\n`);

  for (const bucket of buckets) {
    console.log(`📦 ${bucket.name}`);
    console.log(`   ID: ${bucket.id}`);
    console.log(`   Public: ${bucket.public}`);
    console.log(`   Created: ${bucket.created_at}\n`);

    // List contents of each bucket
    const { data: files } = await supabase
      .storage
      .from(bucket.name)
      .list('', { limit: 100 });

    if (files && files.length > 0) {
      console.log(`   Contents (${files.length} items):`);
      files.slice(0, 10).forEach(f => {
        console.log(`   - ${f.name} ${f.metadata?.size ? `(${(f.metadata.size / 1024).toFixed(2)} KB)` : '(folder)'}`);
      });

      // If we find a folder, check one level deeper
      for (const file of files.slice(0, 3)) {
        if (!file.metadata?.size) {
          // It's a folder, check contents
          const { data: subFiles } = await supabase
            .storage
            .from(bucket.name)
            .list(file.name, { limit: 10 });

          if (subFiles && subFiles.length > 0) {
            console.log(`\n   📁 ${file.name}/ (${subFiles.length} items):`);
            subFiles.forEach(sf => {
              console.log(`      - ${sf.name} ${sf.metadata?.size ? `(${(sf.metadata.size / 1024).toFixed(2)} KB)` : ''}`);
            });
          }
        }
      }
    } else {
      console.log(`   (Empty)`);
    }

    console.log('\n' + '─'.repeat(70) + '\n');
  }
}

listAllBuckets()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
