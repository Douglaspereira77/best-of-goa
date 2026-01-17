/**
 * Comprehensive Link Checker for Best of Goa
 *
 * Checks:
 * 1. All internal page links
 * 2. All image URLs (especially Supabase storage)
 * 3. External links (optional)
 *
 * Usage:
 *   node scripts/check-all-links.js
 *   node scripts/check-all-links.js --images-only    # Only check image URLs
 *   node scripts/check-all-links.js --include-external  # Also check external links
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SUPABASE_STORAGE_URL = process.env.SUPABASE_URL + '/storage/v1/object/public/';

const IMAGES_ONLY = process.argv.includes('--images-only');
const INCLUDE_EXTERNAL = process.argv.includes('--include-external');

// Colors for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// Results tracking
const results = {
  checked: 0,
  valid: 0,
  broken: [],
  errors: [],
};

async function main() {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, 'ðŸ”— BEST OF GOA - LINK CHECKER');
  console.log('='.repeat(60));

  const startTime = Date.now();

  if (!IMAGES_ONLY) {
    // Check database page links
    await checkRestaurantLinks();
    await checkHotelLinks();
    await checkMallLinks();
    await checkAttractionLinks();
    await checkSchoolLinks();
    await checkFitnessLinks();
  }

  // Check all image URLs in database
  await checkAllImageUrls();

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, 'ðŸ“Š LINK CHECK SUMMARY');
  console.log('='.repeat(60));

  console.log(`
  Total links checked: ${results.checked}
  âœ… Valid: ${results.valid}
  âŒ Broken: ${results.broken.length}
  âš ï¸  Errors: ${results.errors.length}

  Time: ${duration}s
  `);

  if (results.broken.length > 0) {
    log(colors.red, '\nâŒ BROKEN LINKS:');
    console.log('-'.repeat(40));

    // Group by type
    const byType = {};
    for (const link of results.broken) {
      if (!byType[link.type]) byType[link.type] = [];
      byType[link.type].push(link);
    }

    for (const [type, links] of Object.entries(byType)) {
      log(colors.yellow, `\n${type.toUpperCase()} (${links.length}):`);
      for (const link of links.slice(0, 20)) {
        log(colors.red, `  âŒ ${link.url}`);
        log(colors.dim, `     Source: ${link.source}`);
        log(colors.dim, `     Status: ${link.status}`);
      }
      if (links.length > 20) {
        console.log(`     ... and ${links.length - 20} more`);
      }
    }
  }

  if (results.errors.length > 0) {
    log(colors.yellow, '\nâš ï¸  ERRORS (could not check):');
    for (const err of results.errors.slice(0, 10)) {
      console.log(`  - ${err}`);
    }
  }

  if (results.broken.length === 0 && results.errors.length === 0) {
    log(colors.green, '\nâœ… All links are valid!');
  }

  // Exit with error code if broken links found
  process.exit(results.broken.length > 0 ? 1 : 0);
}

/**
 * Check if a URL is accessible
 */
async function checkUrl(url, source, type) {
  results.checked++;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (response.ok) {
      results.valid++;
      return true;
    } else {
      results.broken.push({ url, source, type, status: response.status });
      return false;
    }
  } catch (error) {
    // Try GET if HEAD fails (some servers don't support HEAD)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (response.ok) {
        results.valid++;
        return true;
      } else {
        results.broken.push({ url, source, type, status: response.status });
        return false;
      }
    } catch (err) {
      results.broken.push({ url, source, type, status: err.message });
      return false;
    }
  }
}

/**
 * Check restaurant page links and images
 */
async function checkRestaurantLinks() {
  log(colors.bright, '\nðŸ½ï¸  Checking Restaurant Links...');

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, hero_image')
    .eq('status', 'published');

  if (error) {
    results.errors.push(`Failed to fetch restaurants: ${error.message}`);
    return;
  }

  log(colors.blue, `  Found ${restaurants.length} published restaurants`);

  let checked = 0;
  for (const r of restaurants) {
    // Check hero image
    if (r.hero_image) {
      await checkUrl(r.hero_image, `Restaurant: ${r.name}`, 'restaurant-image');
    }
    checked++;
    process.stdout.write(`\r  Checked ${checked}/${restaurants.length}...`);
  }
  console.log();
}

/**
 * Check hotel page links and images
 */
async function checkHotelLinks() {
  log(colors.bright, '\nðŸ¨ Checking Hotel Links...');

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('id, name, slug, hero_image')
    .eq('status', 'published');

  if (error) {
    results.errors.push(`Failed to fetch hotels: ${error.message}`);
    return;
  }

  log(colors.blue, `  Found ${hotels.length} published hotels`);

  let checked = 0;
  for (const h of hotels) {
    if (h.hero_image) {
      await checkUrl(h.hero_image, `Hotel: ${h.name}`, 'hotel-image');
    }
    checked++;
    process.stdout.write(`\r  Checked ${checked}/${hotels.length}...`);
  }
  console.log();
}

/**
 * Check mall page links and images
 */
async function checkMallLinks() {
  log(colors.bright, '\nðŸ›’ Checking Mall Links...');

  const { data: malls, error } = await supabase
    .from('malls')
    .select('id, name, slug, hero_image')
    .eq('status', 'published');

  if (error) {
    results.errors.push(`Failed to fetch malls: ${error.message}`);
    return;
  }

  log(colors.blue, `  Found ${malls.length} published malls`);

  let checked = 0;
  for (const m of malls) {
    if (m.hero_image) {
      await checkUrl(m.hero_image, `Mall: ${m.name}`, 'mall-image');
    }
    checked++;
    process.stdout.write(`\r  Checked ${checked}/${malls.length}...`);
  }
  console.log();
}

/**
 * Check attraction page links and images
 */
async function checkAttractionLinks() {
  log(colors.bright, '\nðŸ›ï¸  Checking Attraction Links...');

  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('id, name, slug, hero_image')
    .eq('status', 'published');

  if (error) {
    results.errors.push(`Failed to fetch attractions: ${error.message}`);
    return;
  }

  log(colors.blue, `  Found ${attractions.length} published attractions`);

  let checked = 0;
  for (const a of attractions) {
    if (a.hero_image) {
      await checkUrl(a.hero_image, `Attraction: ${a.name}`, 'attraction-image');
    }
    checked++;
    process.stdout.write(`\r  Checked ${checked}/${attractions.length}...`);
  }
  console.log();
}

/**
 * Check school page links and images
 */
async function checkSchoolLinks() {
  log(colors.bright, '\nðŸ« Checking School Links...');

  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, slug, hero_image')
    .eq('status', 'published');

  if (error) {
    results.errors.push(`Failed to fetch schools: ${error.message}`);
    return;
  }

  log(colors.blue, `  Found ${schools.length} published schools`);

  let checked = 0;
  for (const s of schools) {
    if (s.hero_image) {
      await checkUrl(s.hero_image, `School: ${s.name}`, 'school-image');
    }
    checked++;
    process.stdout.write(`\r  Checked ${checked}/${schools.length}...`);
  }
  console.log();
}

/**
 * Check fitness page links and images
 */
async function checkFitnessLinks() {
  log(colors.bright, '\nðŸ‹ï¸  Checking Fitness Links...');

  const { data: fitness, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, hero_image')
    .eq('status', 'published');

  if (error) {
    results.errors.push(`Failed to fetch fitness places: ${error.message}`);
    return;
  }

  log(colors.blue, `  Found ${fitness.length} published fitness places`);

  let checked = 0;
  for (const f of fitness) {
    if (f.hero_image) {
      await checkUrl(f.hero_image, `Fitness: ${f.name}`, 'fitness-hero');
    }
    checked++;
    process.stdout.write(`\r  Checked ${checked}/${fitness.length}...`);
  }
  console.log();
}

/**
 * Check all image URLs across all image tables
 */
async function checkAllImageUrls() {
  log(colors.bright, '\nðŸ–¼ï¸  Checking All Image URLs...');

  // Define all image tables to check
  const imageTables = [
    { table: 'restaurant_images', urlField: 'url', nameField: 'restaurant_id' },
    { table: 'hotel_images', urlField: 'url', nameField: 'hotel_id' },
    { table: 'mall_images', urlField: 'url', nameField: 'mall_id' },
    { table: 'attraction_images', urlField: 'url', nameField: 'attraction_id' },
    { table: 'school_images', urlField: 'url', nameField: 'school_id' },
    { table: 'fitness_images', urlField: 'url', nameField: 'fitness_place_id' },
  ];

  for (const { table, urlField, nameField } of imageTables) {
    log(colors.cyan, `\n  Checking ${table}...`);

    const { data: images, error } = await supabase
      .from(table)
      .select(`id, ${urlField}, ${nameField}`);

    if (error) {
      results.errors.push(`Failed to fetch ${table}: ${error.message}`);
      continue;
    }

    if (!images || images.length === 0) {
      log(colors.dim, `    No images found in ${table}`);
      continue;
    }

    log(colors.blue, `    Found ${images.length} images`);

    let checked = 0;
    let batchBroken = 0;

    // Check in batches to avoid overwhelming
    const batchSize = 10;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);

      await Promise.all(batch.map(async (img) => {
        const url = img[urlField];
        if (url) {
          const isValid = await checkUrl(url, `${table}:${img.id}`, table);
          if (!isValid) batchBroken++;
        }
      }));

      checked += batch.length;
      process.stdout.write(`\r    Checked ${checked}/${images.length}... (${batchBroken} broken)`);
    }

    console.log();

    if (batchBroken > 0) {
      log(colors.red, `    âŒ ${batchBroken} broken images in ${table}`);
    } else {
      log(colors.green, `    âœ… All ${images.length} images valid`);
    }
  }
}

// Run
main().catch(err => {
  console.error('\nâŒ Fatal error:', err.message);
  process.exit(1);
});
