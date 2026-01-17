import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findBadSentiment() {
  console.log('=' .repeat(80))
  console.log('FINDING RESTAURANTS WITH BAD REVIEW SENTIMENT')
  console.log('=' .repeat(80))
  console.log()

  // Fetch all restaurants
  console.log('📊 Fetching all restaurants...')

  let allRestaurants = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, review_sentiment, apify_output, google_review_count')
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

  // Define bad sentiment patterns
  const badPatterns = [
    /currently,? there are no customer reviews available/i,
    /there are no specific customer reviews available/i,
    /while there are no specific (customer )?reviews available/i,
    /no customer reviews? (are )?available/i,
    /reviews? (are )?not (yet )?available/i,
    /awaiting customer feedback/i,
    /customer reviews? coming soon/i
  ]

  // Find restaurants with bad sentiment that have reviews
  const problematic = []

  for (const restaurant of allRestaurants) {
    const sentiment = restaurant.review_sentiment || ''
    const reviews = restaurant.apify_output?.reviews || []

    // Check if sentiment matches any bad pattern
    const hasBadSentiment = badPatterns.some(pattern => pattern.test(sentiment))

    // Check if there are actual reviews with text
    const reviewsWithText = reviews.filter(r => {
      const text = r.text || r.review || ''
      return text.trim().length > 0
    })

    if (hasBadSentiment && reviews.length > 0) {
      problematic.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        sentiment: sentiment.substring(0, 100),
        totalReviews: reviews.length,
        textReviews: reviewsWithText.length,
        googleReviewCount: restaurant.google_review_count
      })
    }
  }

  console.log('=' .repeat(80))
  console.log(`🔍 FOUND ${problematic.length} RESTAURANTS WITH BAD SENTIMENT`)
  console.log('=' .repeat(80))
  console.log()

  if (problematic.length === 0) {
    console.log('✅ No restaurants found with bad sentiment!')
    console.log()
    return
  }

  // Sort by number of reviews (most reviews first)
  problematic.sort((a, b) => b.textReviews - a.textReviews)

  console.log('Top 20 by number of text reviews:')
  console.log()

  problematic.slice(0, 20).forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`)
    console.log(`   Slug: ${r.slug}`)
    console.log(`   Google Reviews: ${r.googleReviewCount}`)
    console.log(`   Apify Reviews: ${r.totalReviews} (${r.textReviews} with text)`)
    console.log(`   Current: "${r.sentiment}..."`)
    console.log()
  })

  console.log('=' .repeat(80))
  console.log('SUMMARY:')
  console.log(`   Total restaurants checked: ${allRestaurants.length}`)
  console.log(`   Restaurants with bad sentiment: ${problematic.length}`)
  console.log(`   Total reviews available: ${problematic.reduce((sum, r) => sum + r.totalReviews, 0)}`)
  console.log(`   Total text reviews: ${problematic.reduce((sum, r) => sum + r.textReviews, 0)}`)
  console.log('=' .repeat(80))
  console.log()

  // Export list for batch processing
  console.log('💾 Saving full list to bad-sentiment-restaurants.json...')
  const fs = await import('fs')
  fs.writeFileSync(
    join(__dirname, '..', 'bad-sentiment-restaurants.json'),
    JSON.stringify(problematic, null, 2)
  )
  console.log('✅ Saved!')
}

findBadSentiment().catch(console.error)
