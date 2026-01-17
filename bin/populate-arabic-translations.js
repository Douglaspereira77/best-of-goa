/**
 * Arabic Translation Script
 *
 * Uses OpenAI GPT-4o-mini to translate restaurant names and descriptions to Arabic
 * for restaurants that don't have Arabic content yet.
 *
 * Priority: High-traffic restaurants first (by review count)
 * Cost: ~$0.01 per restaurant (GPT-4o-mini pricing)
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = process.argv.includes('--all') ? null : 50; // Default: top 50, use --all for all restaurants
const BATCH_DELAY = 1000; // 1 second between API calls to avoid rate limits

// Statistics tracking
const stats = {
  totalProcessed: 0,
  totalUpdated: 0,
  fieldsUpdated: {
    name_ar: 0,
    description_ar: 0
  },
  errors: [],
  skipped: {
    noData: 0,
    alreadyPopulated: 0
  },
  apiCalls: 0,
  estimatedCost: 0
};

// Helper: Translate text to Arabic using OpenAI
async function translateToArabic(text, context = 'restaurant') {
  if (!text) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in restaurant and food-related content.
Translate the following English ${context} to Modern Standard Arabic (MSA).
For restaurant names: Keep brand names in English if they are internationally recognized brands (e.g., "McDonald's", "KFC").
For descriptions: Provide natural, culturally appropriate Arabic translation.
Return ONLY the Arabic translation, nothing else.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    stats.apiCalls++;

    // Estimate cost (GPT-4o-mini: $0.150 per 1M input tokens, $0.600 per 1M output tokens)
    const inputTokens = response.usage.prompt_tokens;
    const outputTokens = response.usage.completion_tokens;
    const cost = (inputTokens / 1000000 * 0.150) + (outputTokens / 1000000 * 0.600);
    stats.estimatedCost += cost;

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error(`  ❌ Translation API error: ${error.message}`);
    stats.errors.push({
      text: text.substring(0, 50),
      error: error.message
    });
    return null;
  }
}

// Helper: Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main processing function
async function processRestaurant(restaurant) {
  const updates = {};
  const log = [];

  try {
    // 1. Translate name
    if (!restaurant.name_ar && restaurant.name) {
      log.push(`  🔄 Translating name: "${restaurant.name}"...`);
      const nameAr = await translateToArabic(restaurant.name, 'restaurant name');

      if (nameAr) {
        updates.name_ar = nameAr;
        log.push(`  ✅ NAME_AR: ${nameAr}`);
        stats.fieldsUpdated.name_ar++;
      }

      await sleep(BATCH_DELAY); // Rate limiting
    } else if (restaurant.name_ar) {
      stats.skipped.alreadyPopulated++;
    }

    // 2. Translate description
    if (!restaurant.description_ar && restaurant.description) {
      log.push(`  🔄 Translating description...`);
      const descriptionAr = await translateToArabic(restaurant.description, 'restaurant description');

      if (descriptionAr) {
        updates.description_ar = descriptionAr;
        log.push(`  ✅ DESCRIPTION_AR: ${descriptionAr.substring(0, 100)}...`);
        stats.fieldsUpdated.description_ar++;
      }

      await sleep(BATCH_DELAY); // Rate limiting
    } else if (restaurant.description_ar) {
      stats.skipped.alreadyPopulated++;
    }

    // 3. Apply updates if any
    if (Object.keys(updates).length > 0) {
      console.log(`\n📍 ${restaurant.name} (${restaurant.area}) - ${restaurant.total_reviews_aggregated || 0} reviews`);
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
async function translateRestaurants() {
  console.log('🌍 ARABIC TRANSLATION SCRIPT');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '✅ LIVE RUN'}`);
  console.log(`Limit: ${LIMIT ? `Top ${LIMIT} restaurants by review count` : 'All restaurants'}`);
  console.log(`Model: GPT-4o-mini (cost: ~$0.01 per restaurant)`);
  console.log('='.repeat(80));

  try {
    // Fetch restaurants ordered by review count (high-traffic first)
    console.log('\n📥 Fetching restaurants...');

    let query = supabase
      .from('restaurants')
      .select('id, name, name_ar, description, description_ar, area, total_reviews_aggregated')
      .order('total_reviews_aggregated', { ascending: false, nullsFirst: false });

    if (LIMIT) {
      query = query.limit(LIMIT);
    }

    const { data: restaurants, error } = await query;

    if (error) {
      throw error;
    }

    console.log(`\n✅ Loaded ${restaurants.length} restaurants`);

    // Estimate cost
    const restaurantsNeedingTranslation = restaurants.filter(r => !r.name_ar || !r.description_ar);
    const estimatedCost = restaurantsNeedingTranslation.length * 0.01;
    console.log(`\n💰 Estimated Cost: $${estimatedCost.toFixed(2)}`);
    console.log(`   ${restaurantsNeedingTranslation.length} restaurants need translation`);

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - Translating first 3 as test...\n');
      restaurants.length = Math.min(3, restaurants.length);
    }

    // Process restaurants
    console.log('\n🔄 Processing restaurants...\n');

    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      await processRestaurant(restaurant);

      stats.totalProcessed++;

      // Progress indicator
      if ((i + 1) % 5 === 0) {
        const progress = ((i + 1) / restaurants.length * 100).toFixed(1);
        console.log(`\n⏳ Progress: ${i + 1}/${restaurants.length} (${progress}%) - ${stats.totalUpdated} updated - Cost: $${stats.estimatedCost.toFixed(4)}`);
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

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`  ${err.restaurant || err.text}: ${err.error}`);
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

    console.log('\n💰 API Usage:');
    console.log(`  Total API calls: ${stats.apiCalls}`);
    console.log(`  Estimated cost: $${stats.estimatedCost.toFixed(4)}`);

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('Run without --dry-run flag to apply changes');
      console.log('Use --all flag to translate all restaurants (not just top 50)');
    } else {
      console.log('\n✅ Changes applied to database');
    }

    // Save detailed log
    const logFile = path.join(__dirname, '..', 'logs', `arabic-translation-${Date.now()}.json`);
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
translateRestaurants().then(() => {
  console.log('\n✅ Arabic translation complete!\n');
  process.exit(0);
});
