import { createClient } from '@supabase/supabase-js'
import { ratingService } from '../src/lib/services/rating-service'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateToAdvancedRating() {
  console.log('=' .repeat(80))
  console.log('MIGRATING TO ADVANCED RATING SYSTEM')
  console.log('=' .repeat(80))
  console.log()

  // Fetch all restaurants
  console.log('📊 Fetching all restaurants...')

  let allRestaurants: any[] = []
  let page = 0
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, google_rating, google_review_count, tripadvisor_rating, tripadvisor_review_count, review_sentiment, price_level, average_meal_price, accessibility_features, awards, description, short_description, apify_output, bok_score')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (data.length === 0) {
      hasMore = false
    } else {
      allRestaurants = allRestaurants.concat(data)
      page++
      console.log(`   Fetched page ${page}: ${data.length} restaurants`)
    }
  }

  console.log(`   Total: ${allRestaurants.length} restaurants`)
  console.log()

  // RECALCULATE ALL restaurants (v3.1 - balanced sentiment penalties)
  const needsCalculation = allRestaurants.filter(r => r.google_rating && r.google_review_count)

  const oldVersion = allRestaurants.filter(r => r.bok_score && r.bok_score_version !== '3.1')
  const noScore = allRestaurants.filter(r => !r.bok_score)

  console.log('=' .repeat(80))
  console.log(`🎯 RECALCULATING ALL RESTAURANTS WITH v3.1 ALGORITHM (BALANCED)`)
  console.log(`   ${oldVersion.length} restaurants with older algorithm versions`)
  console.log(`   ${noScore.length} restaurants without BOK scores`)
  console.log(`   ${needsCalculation.length} total restaurants to process`)
  console.log('=' .repeat(80))
  console.log()

  if (needsCalculation.length === 0) {
    console.log('✅ No restaurants to process!')
    console.log()
    return
  }

  let successCount = 0
  let failCount = 0
  let skippedCount = 0

  for (let i = 0; i < needsCalculation.length; i++) {
    const restaurant = needsCalculation[i]

    console.log(`[${i + 1}/${needsCalculation.length}] ${restaurant.name}`)
    console.log(`   Slug: ${restaurant.slug}`)

    // Check if we have minimum data needed
    if (!restaurant.google_rating || !restaurant.google_review_count) {
      console.log(`   ⚠️  Skipped: No Google rating data`)
      skippedCount++
      console.log()
      continue
    }

    try {
      const ratingData = {
        google_rating: restaurant.google_rating,
        google_review_count: restaurant.google_review_count,
        tripadvisor_rating: restaurant.tripadvisor_rating,
        tripadvisor_review_count: restaurant.tripadvisor_review_count,
        review_sentiment: restaurant.review_sentiment,
        price_level: restaurant.price_level,
        average_meal_price: restaurant.average_meal_price,
        accessibility_features: restaurant.accessibility_features,
        awards: restaurant.awards,
        description: restaurant.description,
        short_description: restaurant.short_description,
        apify_output: restaurant.apify_output,
      }

      console.log(`   🤖 Calculating BOK Score...`)
      const ratingResult = await ratingService.calculateRestaurantRating(ratingData)

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          bok_score: ratingResult.overall_rating,
          bok_score_breakdown: ratingResult.rating_breakdown,
          total_reviews_aggregated: ratingResult.total_reviews_aggregated,
          bok_score_calculated_at: new Date().toISOString(),
          bok_score_version: '3.1',
        })
        .eq('id', restaurant.id)

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
        failCount++
      } else {
        console.log(`   ✅ BOK Score: ${ratingResult.overall_rating}/10`)
        console.log(`      Food: ${ratingResult.rating_breakdown.food_quality}/10 | Service: ${ratingResult.rating_breakdown.service}/10 | Ambience: ${ratingResult.rating_breakdown.ambience}/10`)
        successCount++
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      failCount++
    }

    console.log()

    // Small delay to avoid overwhelming the system
    if (i % 10 === 0 && i > 0) {
      console.log(`   ⏸️  Pausing for 2 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log()
    }
  }

  console.log('=' .repeat(80))
  console.log('MIGRATION SUMMARY:')
  console.log(`   Total restaurants: ${allRestaurants.length}`)
  console.log(`   Already had BOK scores: ${allRestaurants.length - needsCalculation.length}`)
  console.log(`   Needed calculation: ${needsCalculation.length}`)
  console.log(`   ✅ Successfully calculated: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   ⚠️  Skipped (no data): ${skippedCount}`)
  console.log('=' .repeat(80))
  console.log()
  console.log('💡 Next steps:')
  console.log('   1. Verify BOK scores are displaying correctly on restaurant pages')
  console.log('   2. Check component breakdown displays')
  console.log('   3. Test on localhost:3000/places-to-eat/restaurants/[slug]')
  console.log()
}

migrateToAdvancedRating().catch(console.error)
