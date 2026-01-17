#!/usr/bin/env node

/**
 * Apply quality_score column migration to ALL image tables
 * This fixes the 500 error when uploading images with AI analysis
 * Run with: node bin/apply-attraction-images-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Applying migration: Add quality_score to attraction_images...');

  try {
    // Check if column already exists
    const { data: existingData, error: checkError } = await supabase
      .from('attraction_images')
      .select('quality_score')
      .limit(0);

    if (!checkError) {
      console.log('✓ Column quality_score already exists!');
      return;
    }

    // Column doesn't exist (either PGRST204 or PostgreSQL 42703 error)
    if (checkError.code !== 'PGRST204' && checkError.code !== '42703') {
      console.error('Unexpected error checking column:', checkError);
      return;
    }

    console.log('✗ Column missing! Run the following SQL in Supabase SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(`
-- Add quality_score to all image tables (1-100 scale)
ALTER TABLE restaurant_images ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100);
ALTER TABLE hotel_images ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100);
ALTER TABLE mall_images ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100);
ALTER TABLE attraction_images ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100);
ALTER TABLE fitness_images ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100);

-- Fix school_images (convert from 0-1 DECIMAL to 1-100 INTEGER scale)
UPDATE school_images SET quality_score = ROUND(quality_score * 100) WHERE quality_score IS NOT NULL;
ALTER TABLE school_images DROP CONSTRAINT IF EXISTS school_images_quality_score_check;
ALTER TABLE school_images ALTER COLUMN quality_score TYPE INTEGER USING ROUND(quality_score);
ALTER TABLE school_images ADD CONSTRAINT school_images_quality_score_check CHECK (quality_score >= 1 AND quality_score <= 100);
    `);
    console.log('='.repeat(80) + '\n');
    console.log('Go to: https://supabase.com/dashboard/project/qcqxcffgfdsqfrwwvabh/sql/new');

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
