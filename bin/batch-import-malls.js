#!/usr/bin/env node
/**
 * Batch Import Malls from CSV
 *
 * Reads mall list from CSV, searches Google Places for each, and triggers full extraction
 * Processes 2 malls at a time with full pipeline including image extraction
 *
 * Usage: node bin/batch-import-malls.js [csv-path]
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BATCH_SIZE = 2; // Process 2 malls at a time
const DELAY_BETWEEN_BATCHES = 5000; // 5 second delay between batches

// Clean up mall names for better Google Places search
function cleanMallName(name) {
  return name
    // Remove year references
    .replace(/\s*-?\s*\d{4}\s*(&\s*\d{4})?\s*/g, ' ')
    // Remove " - " separators
    .replace(/\s+-\s+/g, ' ')
    // Remove "Al - " with space
    .replace(/Al\s*-\s*/gi, 'Al ')
    // Clean multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Search Google Places for a mall
async function searchGooglePlaces(mallName) {
  const query = encodeURIComponent(`${mallName} Mall Goa`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=shopping_mall&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log(`   âš ï¸  No Google Places results for "${mallName}"`);
      return null;
    }

    const result = data.results[0];
    return {
      place_id: result.place_id,
      name: result.name,
      address: result.formatted_address,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      geometry: result.geometry
    };
  } catch (error) {
    console.error(`   âŒ Google Places search failed:`, error.message);
    return null;
  }
}

// Check if mall already exists in database
async function mallExists(placeId) {
  const { data } = await supabase
    .from('malls')
    .select('id, name')
    .eq('google_place_id', placeId)
    .single();

  return data;
}

// Trigger extraction for a mall via API
async function triggerExtraction(placeData) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/admin/malls/start-extraction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_id: placeData.place_id,
        search_query: placeData.name,
        place_data: {
          name: placeData.name,
          formatted_address: placeData.address,
          geometry: placeData.geometry,
          rating: placeData.rating,
          user_ratings_total: placeData.user_ratings_total
        },
        override: false
      })
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.exists) {
        return { skipped: true, mall_id: result.mall_id, reason: 'Already exists' };
      }
      throw new Error(result.error || 'Extraction failed');
    }

    return { success: true, mall_id: result.mall_id };
  } catch (error) {
    return { error: error.message };
  }
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const malls = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const mall = {};
    headers.forEach((header, index) => {
      mall[header] = values[index];
    });
    malls.push(mall);
  }

  return malls;
}

// Process a batch of malls
async function processBatch(malls, batchNum, totalBatches) {
  console.log(`\nðŸ“¦ Processing batch ${batchNum}/${totalBatches} (${malls.length} malls)`);
  console.log('='.repeat(50));

  const results = [];

  for (const mall of malls) {
    const originalName = mall['Mall Name'];
    const cleanedName = cleanMallName(originalName);
    const csvRating = parseFloat(mall.Rating);
    const csvReviews = parseInt(mall.Reviews);

    console.log(`\nðŸ¬ ${originalName}`);
    if (cleanedName !== originalName) {
      console.log(`   Cleaned: "${cleanedName}"`);
    }
    console.log(`   CSV Data: Rating ${csvRating}, ${csvReviews} reviews`);

    // Search Google Places
    console.log('   ðŸ” Searching Google Places...');
    const placeData = await searchGooglePlaces(cleanedName);

    if (!placeData) {
      results.push({ name: originalName, status: 'not_found' });
      continue;
    }

    console.log(`   âœ… Found: ${placeData.name}`);
    console.log(`      Place ID: ${placeData.place_id}`);
    console.log(`      Rating: ${placeData.rating} (${placeData.user_ratings_total} reviews)`);

    // Check if already exists
    const existing = await mallExists(placeData.place_id);
    if (existing) {
      console.log(`   â­ï¸  Already in database: ${existing.name}`);
      results.push({ name: originalName, status: 'exists', mall_id: existing.id });
      continue;
    }

    // Trigger extraction
    console.log('   ðŸš€ Starting extraction...');
    const extractionResult = await triggerExtraction(placeData);

    if (extractionResult.skipped) {
      console.log(`   â­ï¸  Skipped: ${extractionResult.reason}`);
      results.push({ name: originalName, status: 'skipped', mall_id: extractionResult.mall_id });
    } else if (extractionResult.error) {
      console.log(`   âŒ Error: ${extractionResult.error}`);
      results.push({ name: originalName, status: 'error', error: extractionResult.error });
    } else {
      console.log(`   âœ… Extraction started: ${extractionResult.mall_id}`);
      results.push({ name: originalName, status: 'started', mall_id: extractionResult.mall_id });
    }

    // Small delay between malls
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

// Main import function
async function batchImport() {
  const csvPath = process.argv[2] || 'C:\\Users\\Douglas\\Downloads\\malls.csv';

  console.log('ðŸª Mall Batch Import Tool');
  console.log('='.repeat(50));
  console.log(`ðŸ“„ CSV File: ${csvPath}`);

  // Check file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`âŒ File not found: ${csvPath}`);
    process.exit(1);
  }

  // Check API key
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('âŒ GOOGLE_PLACES_API_KEY not configured');
    process.exit(1);
  }

  // Parse CSV
  const malls = parseCSV(csvPath);
  console.log(`ðŸ“Š Found ${malls.length} malls in CSV`);

  // Skip The Avenues (already imported)
  const mallsToImport = malls.filter(m =>
    !m['Mall Name'].toLowerCase().includes('avenues')
  );
  console.log(`ðŸŽ¯ Importing ${mallsToImport.length} malls (excluding The Avenues)`);

  // Create batches
  const batches = [];
  for (let i = 0; i < mallsToImport.length; i += BATCH_SIZE) {
    batches.push(mallsToImport.slice(i, i + BATCH_SIZE));
  }

  console.log(`ðŸ“¦ Split into ${batches.length} batches of ${BATCH_SIZE} malls each`);
  console.log('');

  // Ask for confirmation
  console.log('âš ï¸  This will:');
  console.log('   - Search Google Places for each mall');
  console.log('   - Create database records');
  console.log('   - Run full 12-step extraction pipeline');
  console.log('   - Extract 10 images per mall with AI analysis');
  console.log('   - Generate AI descriptions and SEO metadata');
  console.log('');
  console.log('ðŸ• Estimated time: ~5-10 minutes per mall');
  console.log(`   Total: ${mallsToImport.length} malls = ${Math.ceil(mallsToImport.length * 7.5)} minutes approx`);
  console.log('');

  // Process batches
  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    const batchResults = await processBatch(batches[i], i + 1, batches.length);
    allResults.push(...batchResults);

    // Delay between batches (except last)
    if (i < batches.length - 1) {
      console.log(`\nâ³ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(50));
  console.log('ðŸ“Š IMPORT SUMMARY');
  console.log('='.repeat(50));

  const started = allResults.filter(r => r.status === 'started');
  const exists = allResults.filter(r => r.status === 'exists' || r.status === 'skipped');
  const notFound = allResults.filter(r => r.status === 'not_found');
  const errors = allResults.filter(r => r.status === 'error');

  console.log(`âœ… Extraction Started: ${started.length}`);
  console.log(`â­ï¸  Already Exists: ${exists.length}`);
  console.log(`âš ï¸  Not Found in Google: ${notFound.length}`);
  console.log(`âŒ Errors: ${errors.length}`);

  if (notFound.length > 0) {
    console.log('\nâš ï¸  Malls not found in Google Places:');
    notFound.forEach(r => console.log(`   - ${r.name}`));
  }

  if (errors.length > 0) {
    console.log('\nâŒ Malls with errors:');
    errors.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  console.log('\nðŸ“ Monitor extraction progress at:');
  console.log('   http://localhost:3000/admin/malls/queue');
  console.log('');
  console.log('ðŸŽ‰ Batch import initiated!');
}

batchImport().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
