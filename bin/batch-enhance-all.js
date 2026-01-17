#!/usr/bin/env node

/**
 * Batch AI Enhancement Script
 *
 * Runs AI enhancement for restaurants that have been extracted but not yet enhanced.
 * This allows you to extract core data quickly (Apify + Firecrawl), then batch-enhance
 * all restaurants overnight with GPT-4o.
 *
 * Processes:
 * 1. AI enhancement (descriptions, FAQs, dishes)
 * 2. SEO metadata generation
 * 3. Image processing with Vision API (if photos exist but not analyzed)
 *
 * Usage:
 *   node bin/batch-enhance-all.js [--dry-run] [--limit=10] [--restaurant-id=xxx]
 *
 * Options:
 *   --dry-run          Show what would be enhanced without actually running
 *   --limit=N          Process only N restaurants (for testing)
 *   --restaurant-id=X  Process only specific restaurant
 *   --skip-images      Skip image processing (faster, AI only)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
let dryRun = args.includes('--dry-run');
let skipImages = args.includes('--skip-images');
let limit = null;
let restaurantId = null;

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--restaurant-id=')) {
    restaurantId = arg.split('=')[1];
  }
});

async function batchEnhance() {
  // Dynamic imports for TypeScript modules
  const { default: OpenAIClient } = await import('../src/lib/services/openai-client.ts');
  const { default: ImageExtractor } = await import('../src/lib/services/image-extractor.ts');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const openaiClient = new OpenAIClient();
  const imageExtractor = new ImageExtractor(supabase);
  console.log('🤖 BATCH AI ENHANCEMENT SCRIPT');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Find restaurants needing enhancement
  let query = supabase
    .from('restaurants')
    .select('id, name, slug, apify_output, firecrawl_output, ai_enhancement_output, seo_metadata, photos')
    .eq('status', 'active'); // Fixed: use 'status' column instead of 'extraction_status'

  if (restaurantId) {
    query = query.eq('id', restaurantId);
  } else {
    // Only restaurants without AI enhancement
    query = query.is('ai_enhancement_output', null);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error('❌ Error fetching restaurants:', error.message);
    return;
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ No restaurants need AI enhancement!\n');
    return;
  }

  console.log(`📊 Found ${restaurants.length} restaurant(s) needing enhancement\n`);

  if (dryRun) {
    console.log('Would enhance:');
    restaurants.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name} (${r.slug})`);
    });
    console.log('');
    return;
  }

  // Cost estimation
  const estimatedCost = restaurants.length * 0.15; // ~$0.15 per restaurant
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)} (${restaurants.length} × $0.15)\n`);

  console.log('Starting batch enhancement...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    const progress = `[${i + 1}/${restaurants.length}]`;

    console.log(`${progress} Processing: ${restaurant.name}`);

    try {
      // ═══════════════════════════════════════════════════════
      // STEP 1: AI Enhancement (GPT-4o)
      // ═══════════════════════════════════════════════════════

      console.log(`${progress}   Step 1/3: Running AI enhancement...`);

      const apifyData = restaurant.apify_output || {};
      const firecrawlData = restaurant.firecrawl_output || {};
      const reviews = apifyData.reviews || [];

      // Prepare input data
      const restaurantData = {
        name: restaurant.name,
        address: apifyData.address || '',
        description: apifyData.description || firecrawlData.description || '',
        categoryName: apifyData.categoryName || '',
        menu: firecrawlData.menu || apifyData.menu || ''
      };

      // Run AI enhancement
      const aiOutput = await openaiClient.enhanceRestaurantData(restaurantData, reviews);

      // Store AI enhancement output
      const aiEnhancementAudit = {
        ...aiOutput,
        generated_at: new Date().toISOString(),
        model: 'gpt-4o',
        input_sources: {
          has_apify_data: !!restaurant.apify_output,
          has_firecrawl_data: !!restaurant.firecrawl_output,
          review_count: reviews.length
        }
      };

      await supabase
        .from('restaurants')
        .update({ ai_enhancement_output: aiEnhancementAudit })
        .eq('id', restaurant.id);

      console.log(`${progress}   ✅ AI enhancement complete`);

      // ═══════════════════════════════════════════════════════
      // STEP 2: SEO Metadata Generation
      // ═══════════════════════════════════════════════════════

      if (!restaurant.seo_metadata) {
        console.log(`${progress}   Step 2/3: Generating SEO metadata...`);

        const seoMetadata = await openaiClient.generateSEOMetadata({
          name: restaurant.name,
          description: aiOutput.description,
          cuisine_suggestions: aiOutput.cuisine_suggestions,
          popular_dishes: aiOutput.popular_dishes,
          area: apifyData.neighborhood || apifyData.area || ''
        });

        await supabase
          .from('restaurants')
          .update({ seo_metadata: seoMetadata })
          .eq('id', restaurant.id);

        console.log(`${progress}   ✅ SEO metadata generated`);
      } else {
        console.log(`${progress}   ⏭️  SEO metadata already exists, skipping`);
      }

      // ═══════════════════════════════════════════════════════
      // STEP 3: Image Processing (if needed)
      // ═══════════════════════════════════════════════════════

      if (!skipImages && restaurant.photos && restaurant.photos.length > 0) {
        // Check if images need Vision API analysis
        const needsAnalysis = restaurant.photos.some(p => !p.alt || !p.title);

        if (needsAnalysis) {
          console.log(`${progress}   Step 3/3: Analyzing ${restaurant.photos.length} images...`);

          // Re-analyze images with Vision API
          const analyzedPhotos = [];

          for (const photo of restaurant.photos) {
            if (!photo.alt || !photo.title) {
              try {
                const analysis = await imageExtractor.analyzeImageWithVision(
                  photo.url,
                  { name: restaurant.name, area: apifyData.area || '' }
                );

                analyzedPhotos.push({
                  ...photo,
                  alt: analysis.alt,
                  title: analysis.title,
                  description: analysis.description,
                  hero_score: analysis.heroScore,
                  hero_reason: analysis.heroReason,
                  is_abstract_art: analysis.isAbstractArt,
                  shows_actual_restaurant: analysis.showsActualRestaurant
                });
              } catch (err) {
                console.log(`${progress}   ⚠️  Failed to analyze image: ${err.message}`);
                analyzedPhotos.push(photo); // Keep original
              }
            } else {
              analyzedPhotos.push(photo); // Already analyzed
            }
          }

          // Update photos
          await supabase
            .from('restaurants')
            .update({ photos: analyzedPhotos })
            .eq('id', restaurant.id);

          console.log(`${progress}   ✅ Image analysis complete`);
        } else {
          console.log(`${progress}   ⏭️  Images already analyzed, skipping`);
        }
      } else if (skipImages) {
        console.log(`${progress}   ⏭️  Skipping image processing (--skip-images flag)`);
      } else {
        console.log(`${progress}   ⏭️  No images to process`);
      }

      successCount++;
      console.log(`${progress} ✅ Complete!\n`);

    } catch (error) {
      errorCount++;
      errors.push({
        restaurant: restaurant.name,
        error: error.message
      });
      console.error(`${progress} ❌ Error: ${error.message}\n`);
    }

    // Rate limiting: Small delay between requests
    if (i < restaurants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 BATCH ENHANCEMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Processed: ${restaurants.length}`);
  console.log(`Successful: ${successCount} ✅`);
  console.log(`Failed: ${errorCount} ❌`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach((e, i) => {
      console.log(`${i + 1}. ${e.restaurant}: ${e.error}`);
    });
    console.log('');
  }

  if (successCount === restaurants.length) {
    console.log('🎉 All restaurants enhanced successfully!\n');
  } else if (errorCount > 0) {
    console.log('⚠️  Some restaurants failed. Run script again to retry failed restaurants.\n');
  }

  console.log('💡 Next steps:');
  console.log('   1. Run quality validation: node bin/validate-extraction-quality.js');
  console.log('   2. Check progress: node bin/extraction-progress.js');
  console.log('   3. When ready, implement SEO infrastructure (sitemap, robots.txt, llm.txt)\n');
}

batchEnhance().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
