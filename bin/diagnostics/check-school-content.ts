#!/usr/bin/env ts-node
/**
 * Check what content was extracted for a school
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchoolContent(schoolName: string) {
  console.log(`\nChecking content for: ${schoolName}\n`);

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .ilike('name', `%${schoolName}%`)
    .single();

  if (!school) {
    console.log('School not found');
    return;
  }

  console.log(`School: ${school.name}`);
  console.log(`Slug: ${school.slug}`);
  console.log('─'.repeat(60));

  const contentFields = [
    'principal_name',
    'principal_message',
    'mission_statement',
    'vision_statement',
    'educational_philosophy',
    'unique_selling_points',
    'special_programs',
    'extracurricular_activities',
    'sports_offered',
    'clubs_offered',
    'languages_taught',
    'partnerships',
    'admission_requirements',
    'application_process',
    'meta_keywords'
  ];

  let populatedCount = 0;

  contentFields.forEach(field => {
    const value = school[field];
    const hasValue = value && (Array.isArray(value) ? value.length > 0 : value.toString().length > 0);

    if (hasValue) {
      populatedCount++;
      console.log(`✅ ${field}: ${Array.isArray(value) ? `${value.length} items` : `${value.toString().substring(0, 50)}...`}`);
    } else {
      console.log(`❌ ${field}: Not populated`);
    }
  });

  console.log('─'.repeat(60));
  console.log(`Total fields populated: ${populatedCount}/${contentFields.length}`);
  console.log('');
}

checkSchoolContent('Al-Bayan')
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
