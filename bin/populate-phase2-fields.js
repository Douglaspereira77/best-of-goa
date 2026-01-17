/**
 * Phase 2: Field Population Script
 *
 * Populates missing fields with data transformation and validation:
 * 1. Email extraction (firecrawl_output.extracted_operational.email OR apify_output.email)
 * 2. Price level conversion (apify_output.price OR opentable price range)
 * 3. Logo image extraction (website metadata)
 *
 * Confidence: Medium (70%)
 * Implementation: Node.js with progress tracking and detailed logging
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 50;

// Statistics tracking
const stats = {
  totalProcessed: 0,
  totalUpdated: 0,
  fieldsUpdated: {
    email: 0,
    price_level: 0,
    logo_image: 0
  },
  errors: [],
  skipped: {
    invalidData: 0,
    noData: 0,
    alreadyPopulated: 0
  }
};

// Helper: Validate email format
function validateEmail(email) {
  if (!email || typeof email !== 'string') return null;

  // Trim and lowercase
  email = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return null;
  }

  // Filter out common placeholder/invalid emails
  const invalidPatterns = [
    'example.com',
    'test.com',
    'placeholder',
    'noreply',
    'no-reply',
    'donotreply'
  ];

  if (invalidPatterns.some(pattern => email.includes(pattern))) {
    return null;
  }

  return email;
}

// Helper: Extract email from multiple sources
function extractEmail(restaurant) {
  // Priority 1: firecrawl_output.extracted_operational.email
  if (restaurant.firecrawl_output?.extracted_operational?.email) {
    const email = validateEmail(restaurant.firecrawl_output.extracted_operational.email);
    if (email) {
      return { email, source: 'firecrawl_extracted_operational' };
    }
  }

  // Priority 2: apify_output.email
  if (restaurant.apify_output?.email) {
    const email = validateEmail(restaurant.apify_output.email);
    if (email) {
      return { email, source: 'apify_output' };
    }
  }

  return null;
}

// Helper: Convert price string to level (1-4)
function convertPriceToLevel(priceString) {
  if (!priceString || typeof priceString !== 'string') return null;

  // Handle "$", "$$", "$$$", "$$$$" format
  if (/^\$+$/.test(priceString)) {
    return Math.min(priceString.length, 4);
  }

  // Handle "KWD X–Y" format
  const kwdMatch = priceString.match(/KWD\s*(\d+)/i);
  if (kwdMatch) {
    const price = parseInt(kwdMatch[1]);
    if (price < 3) return 1;      // Budget: Under KWD 3
    if (price < 6) return 2;      // Moderate: KWD 3-6
    if (price < 10) return 3;     // Upscale: KWD 6-10
    return 4;                     // Fine dining: KWD 10+
  }

  // Handle currency symbols without "KWD"
  const numberMatch = priceString.match(/(\d+)/);
  if (numberMatch) {
    const price = parseInt(numberMatch[1]);
    if (price < 3) return 1;
    if (price < 6) return 2;
    if (price < 10) return 3;
    return 4;
  }

  return null;
}

// Helper: Extract price level from multiple sources
function extractPriceLevel(restaurant) {
  // Priority 1: apify_output.price
  if (restaurant.apify_output?.price) {
    const level = convertPriceToLevel(restaurant.apify_output.price);
    if (level) {
      return { level, source: 'apify_output.price', original: restaurant.apify_output.price };
    }
  }

  // Priority 2: firecrawl_output.opentable.opentable_price_range
  if (restaurant.firecrawl_output?.opentable?.opentable_price_range) {
    const level = convertPriceToLevel(restaurant.firecrawl_output.opentable.opentable_price_range);
    if (level) {
      return { level, source: 'opentable_price_range', original: restaurant.firecrawl_output.opentable.opentable_price_range };
    }
  }

  return null;
}

// Helper: Validate and extract logo image URL
function validateImageUrl(url) {
  if (!url || typeof url !== 'string') return null;

  // Must start with http
  if (!url.startsWith('http')) return null;

  // Filter out common non-logo images
  const invalidPatterns = [
    'favicon.ico',
    'apple-touch-icon',
    'android-chrome',
    'safari-pinned-tab'
  ];

  if (invalidPatterns.some(pattern => url.includes(pattern))) {
    return null;
  }

  // Must be an image format
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
  const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));

  if (!hasImageExtension) {
    // Check if it's a common CDN URL pattern (might not have extension in URL)
    const cdnPatterns = ['cloudinary', 'imgix', 'cloudfront', 'supabase', 'storage.googleapis'];
    if (!cdnPatterns.some(cdn => url.includes(cdn))) {
      return null;
    }
  }

  // Check for malformed URLs
  if (url.includes('[') || url.includes(']') || url.includes('](')) {
    return null;
  }

  return url;
}

// Helper: Extract logo image from metadata
function extractLogoImage(restaurant) {
  const metadata = restaurant.firecrawl_output?.website_scrape?.metadata;
  if (!metadata) return null;

  // Priority 1: msapplication-TileImage (usually high quality)
  if (metadata['msapplication-TileImage']) {
    const url = validateImageUrl(metadata['msapplication-TileImage']);
    if (url) {
      return { url, source: 'msapplication-TileImage' };
    }
  }

  // Priority 2: og:image
  if (metadata['og:image']) {
    const url = validateImageUrl(metadata['og:image']);
    if (url) {
      return { url, source: 'og:image' };
    }
  }

  // Priority 3: twitter:image
  if (metadata['twitter:image']) {
    const url = validateImageUrl(metadata['twitter:image']);
    if (url) {
      return { url, source: 'twitter:image' };
    }
  }

  return null;
}

// Main processing function
async function processRestaurant(restaurant) {
  const updates = {};
  const log = [];

  try {
    // 1. Extract email
    if (!restaurant.email) {
      const emailData = extractEmail(restaurant);
      if (emailData) {
        updates.email = emailData.email;
        log.push(`  ✅ EMAIL: ${emailData.email} (source: ${emailData.source})`);
        stats.fieldsUpdated.email++;
      }
    } else {
      stats.skipped.alreadyPopulated++;
    }

    // 2. Extract price_level
    if (!restaurant.price_level || restaurant.price_level === 0) {
      const priceData = extractPriceLevel(restaurant);
      if (priceData) {
        updates.price_level = priceData.level;
        log.push(`  ✅ PRICE_LEVEL: ${priceData.level} (source: ${priceData.source}, original: "${priceData.original}")`);
        stats.fieldsUpdated.price_level++;
      }
    } else {
      stats.skipped.alreadyPopulated++;
    }

    // 3. Extract logo_image
    if (!restaurant.logo_image) {
      const logoData = extractLogoImage(restaurant);
      if (logoData) {
        updates.logo_image = logoData.url;
        log.push(`  ✅ LOGO_IMAGE: ${logoData.url.substring(0, 60)}... (source: ${logoData.source})`);
        stats.fieldsUpdated.logo_image++;
      }
    } else {
      stats.skipped.alreadyPopulated++;
    }

    // 4. Apply updates if any
    if (Object.keys(updates).length > 0) {
      console.log(`\n📍 ${restaurant.name} (${restaurant.area})`);
      log.forEach(line => console.log(line));

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('restaurants')
          .update(updates)
          .eq('id', restaurant.id);

        if (error) {
          throw error;
        }
      }

      stats.totalUpdated++;
      return true;
    } else {
      stats.skipped.noData++;
      return false;
    }

  } catch (error) {
    console.error(`\n❌ Error processing ${restaurant.name}:`, error.message);
    stats.errors.push({
      restaurant: restaurant.name,
      error: error.message
    });
    return false;
  }
}

// Main execution
async function populateFields() {
  console.log('🚀 PHASE 2: FIELD POPULATION');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '✅ LIVE RUN'}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log('='.repeat(80));

  try {
    // Fetch all restaurants
    console.log('\n📥 Fetching restaurants...');

    // Get total count first
    const { count: totalCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });

    console.log(`  Total restaurants: ${totalCount}`);

    let allRestaurants = [];
    const pageSize = 100; // Smaller batches due to large JSON columns
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, area, email, price_level, logo_image, apify_output, firecrawl_output')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error(`Error fetching page ${page}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        allRestaurants = allRestaurants.concat(data);
        page++;
        console.log(`  Fetched ${allRestaurants.length}/${totalCount} restaurants...`);
      } else {
        hasMore = false;
      }
    }

    console.log(`\n✅ Loaded ${allRestaurants.length} restaurants`);

    // Process in batches
    console.log('\n🔄 Processing restaurants...\n');

    for (let i = 0; i < allRestaurants.length; i++) {
      const restaurant = allRestaurants[i];
      await processRestaurant(restaurant);

      stats.totalProcessed++;

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        const progress = ((i + 1) / allRestaurants.length * 100).toFixed(1);
        console.log(`\n⏳ Progress: ${i + 1}/${allRestaurants.length} (${progress}%) - ${stats.totalUpdated} updated`);
      }
    }

    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTotal Processed: ${stats.totalProcessed}`);
    console.log(`Total Updated: ${stats.totalUpdated}`);
    console.log(`Success Rate: ${(stats.totalUpdated / stats.totalProcessed * 100).toFixed(1)}%`);

    console.log('\n📈 Fields Updated:');
    for (const [field, count] of Object.entries(stats.fieldsUpdated)) {
      if (count > 0) {
        console.log(`  ${field}: ${count}`);
      }
    }

    console.log('\n⏭️  Skipped:');
    console.log(`  Already populated: ${stats.skipped.alreadyPopulated}`);
    console.log(`  No data available: ${stats.skipped.noData}`);
    console.log(`  Invalid data: ${stats.skipped.invalidData}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`  ${err.restaurant}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    }

    // Calculate impact
    const totalFieldUpdates = Object.values(stats.fieldsUpdated).reduce((sum, count) => sum + count, 0);
    console.log('\n🎯 Impact:');
    console.log(`  Total field updates: ${totalFieldUpdates}`);
    if (stats.totalUpdated > 0) {
      console.log(`  Average fields per restaurant: ${(totalFieldUpdates / stats.totalUpdated).toFixed(1)}`);
    }

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('Run without --dry-run flag to apply changes');
    } else {
      console.log('\n✅ Changes applied to database');
    }

    // Save detailed log
    const logFile = path.join(__dirname, '..', 'logs', `phase2-population-${Date.now()}.json`);
    const logDir = path.dirname(logFile);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.writeFileSync(logFile, JSON.stringify(stats, null, 2));
    console.log(`\n📄 Detailed log saved: ${logFile}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run script
console.log('\n');
populateFields().then(() => {
  console.log('\n✅ Phase 2 complete!\n');
  process.exit(0);
});
