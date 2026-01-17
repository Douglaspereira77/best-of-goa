#!/usr/bin/env ts-node
/**
 * List all schools in database
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllSchools() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📚 ALL SCHOOLS IN DATABASE');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get all schools
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, slug, extraction_status, active, hero_image, google_place_id, firecrawl_output')
      .order('name');

    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('⚠️  No schools found in database\n');
      return;
    }

    console.log(`Total schools: ${schools.length}\n`);

    schools.forEach((school, i) => {
      const status = school.extraction_status || 'pending';
      const hasHero = school.hero_image ? '✅' : '❌';
      const hasPlaceId = school.google_place_id ? '✅' : '❌';
      const hasFirecrawl = school.firecrawl_output ? '✅' : '❌';

      console.log(`${i + 1}. ${school.name}`);
      console.log(`   Slug: ${school.slug}`);
      console.log(`   Status: ${status} | Active: ${school.active}`);
      console.log(`   Place ID: ${hasPlaceId} | Hero: ${hasHero} | Firecrawl: ${hasFirecrawl}`);
      console.log('');
    });

    // Summary
    console.log('─'.repeat(60));
    const completed = schools.filter(s => s.extraction_status === 'completed').length;
    const pending = schools.filter(s => s.extraction_status === 'pending').length;
    const processing = schools.filter(s => s.extraction_status === 'processing').length;
    const failed = schools.filter(s => s.extraction_status === 'failed').length;
    const active = schools.filter(s => s.active).length;

    console.log('\nStatus Summary:');
    console.log(`  Completed: ${completed}`);
    console.log(`  Processing: ${processing}`);
    console.log(`  Pending: ${pending}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Active: ${active}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

listAllSchools()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
