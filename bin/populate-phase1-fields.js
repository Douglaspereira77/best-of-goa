/**
 * Phase 1: Field Population Script
 *
 * Populates missing fields from existing JSON data with high confidence:
 * 1. Social media fields (TikTok, YouTube, LinkedIn, Snapchat, Twitter, Facebook, Instagram)
 * 2. Generate og_description from description
 * 3. Normalize existing Instagram URLs to full format
 *
 * Confidence threshold: 70%
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
const CONFIDENCE_THRESHOLD = 70;
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 50;

// Statistics tracking
const stats = {
  totalProcessed: 0,
  totalUpdated: 0,
  fieldsUpdated: {
    tiktok: 0,
    youtube: 0,
    linkedin: 0,
    snapchat: 0,
    twitter: 0,
    facebook: 0,
    instagram: 0,
    og_description: 0
  },
  errors: [],
  skipped: {
    lowConfidence: 0,
    noData: 0,
    alreadyPopulated: 0
  }
};

// Helper: Normalize and validate social media URL
function normalizeSocialUrl(platform, url, handle) {
  if (!url && !handle) return null;

  let finalUrl = url;

  // If we only have handle, construct full URL
  if (!finalUrl && handle) {
    const baseUrls = {
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      twitter: 'https://twitter.com/',
      tiktok: 'https://tiktok.com/@',
      youtube: 'https://youtube.com/',
      linkedin: 'https://linkedin.com/',
      snapchat: 'https://snapchat.com/'
    };

    const base = baseUrls[platform];
    if (!base) return null;

    // Remove @ symbol if present
    const cleanHandle = handle.replace(/^@/, '');
    finalUrl = base + cleanHandle;
  }

  // Validate URL format
  if (!finalUrl || !finalUrl.startsWith('http')) {
    return null;
  }

  // Platform-specific validation
  const platformDomains = {
    instagram: ['instagram.com', 'www.instagram.com'],
    facebook: ['facebook.com', 'www.facebook.com', 'fb.com'],
    twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
    tiktok: ['tiktok.com', 'www.tiktok.com'],
    youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
    linkedin: ['linkedin.com', 'www.linkedin.com'],
    snapchat: ['snapchat.com', 'www.snapchat.com']
  };

  const allowedDomains = platformDomains[platform] || [];

  try {
    const urlObj = new URL(finalUrl);
    const domain = urlObj.hostname.toLowerCase();

    // Check if domain matches platform
    if (!allowedDomains.some(d => domain.includes(d))) {
      return null;
    }

    // Check for malformed URLs (containing brackets, markdown, etc.)
    if (finalUrl.includes('[') || finalUrl.includes(']') || finalUrl.includes('](')) {
      return null;
    }

    // Check for suspicious paths (like /sharer, /intent which are sharing links)
    if (finalUrl.includes('/sharer') || finalUrl.includes('/intent')) {
      return null;
    }

    return finalUrl;
  } catch (e) {
    return null;
  }
}

// Helper: Truncate description to 120 chars at word boundary
function generateOgDescription(description) {
  if (!description) return null;

  const maxLength = 120;

  // If already short enough, return as-is
  if (description.length <= maxLength) {
    return description;
  }

  // Truncate at word boundary
  const truncated = description.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// Helper: Extract social media data from firecrawl_output
function extractSocialMedia(firecrawlOutput, platform) {
  if (!firecrawlOutput?.social_media_search?.[platform]) {
    return null;
  }

  const data = firecrawlOutput.social_media_search[platform];

  // Check if found
  if (!data.found) {
    return null;
  }

  // Check confidence threshold
  const confidence = data.confidence || 0;
  if (confidence < CONFIDENCE_THRESHOLD) {
    stats.skipped.lowConfidence++;
    return null;
  }

  // Normalize URL
  const normalizedUrl = normalizeSocialUrl(platform, data.url, data.handle);

  return {
    url: normalizedUrl,
    confidence,
    source: data.source
  };
}

// Main processing function
async function processRestaurant(restaurant) {
  const updates = {};
  const log = [];

  try {
    // 1. Process social media fields
    const platforms = ['tiktok', 'youtube', 'linkedin', 'snapchat', 'twitter', 'facebook', 'instagram'];

    for (const platform of platforms) {
      // Skip if already populated (except Instagram - we need to normalize)
      if (restaurant[platform] && platform !== 'instagram') {
        stats.skipped.alreadyPopulated++;
        continue;
      }

      // Special handling for Instagram normalization
      if (platform === 'instagram' && restaurant.instagram) {
        // Check if it's just a handle (no http)
        if (!restaurant.instagram.startsWith('http')) {
          const normalizedUrl = normalizeSocialUrl('instagram', null, restaurant.instagram);
          if (normalizedUrl !== restaurant.instagram) {
            updates.instagram = normalizedUrl;
            log.push(`  ✅ Normalized Instagram: ${restaurant.instagram} → ${normalizedUrl}`);
            stats.fieldsUpdated.instagram++;
          }
        }
        continue;
      }

      // Extract from firecrawl_output
      const socialData = extractSocialMedia(restaurant.firecrawl_output, platform);

      if (socialData && socialData.url) {
        updates[platform] = socialData.url;
        log.push(`  ✅ ${platform.toUpperCase()}: ${socialData.url} (confidence: ${socialData.confidence}%, source: ${socialData.source})`);
        stats.fieldsUpdated[platform]++;
      }
    }

    // 2. Generate og_description (stored in seo_metadata JSONB)
    const currentOgDesc = restaurant.seo_metadata?.og_description;
    if (!currentOgDesc && restaurant.description) {
      const ogDesc = generateOgDescription(restaurant.description);
      if (ogDesc) {
        // Merge with existing seo_metadata or create new
        const seoMetadata = restaurant.seo_metadata || {};
        seoMetadata.og_description = ogDesc;
        seoMetadata.generated_at = new Date().toISOString();
        seoMetadata.generated_by = 'populate-phase1-script';

        updates.seo_metadata = seoMetadata;
        log.push(`  ✅ og_description: "${ogDesc.substring(0, 50)}..."`);
        stats.fieldsUpdated.og_description++;
      }
    }

    // 3. Apply updates if any
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
  console.log('🚀 PHASE 1: FIELD POPULATION');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '✅ LIVE RUN'}`);
  console.log(`Confidence Threshold: ${CONFIDENCE_THRESHOLD}%`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log('='.repeat(80));

  try {
    // Fetch all restaurants
    console.log('\n📥 Fetching restaurants...');

    let allRestaurants = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, area, description, seo_metadata, instagram, facebook, twitter, tiktok, youtube, linkedin, snapchat, firecrawl_output')
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allRestaurants = allRestaurants.concat(data);
        page++;
        console.log(`  Fetched ${allRestaurants.length} restaurants...`);
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
    console.log(`  Low confidence (<${CONFIDENCE_THRESHOLD}%): ${stats.skipped.lowConfidence}`);

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
    console.log(`  Average fields per restaurant: ${(totalFieldUpdates / stats.totalUpdated).toFixed(1)}`);

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('Run without --dry-run flag to apply changes');
    } else {
      console.log('\n✅ Changes applied to database');
    }

    // Save detailed log
    const logFile = path.join(__dirname, '..', 'logs', `phase1-population-${Date.now()}.json`);
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
  console.log('\n✅ Phase 1 complete!\n');
  process.exit(0);
});
