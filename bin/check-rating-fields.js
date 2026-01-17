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

async function checkRatingFields() {
  console.log('=' .repeat(80))
  console.log('RATING SYSTEM ANALYSIS')
  console.log('=' .repeat(80))
  console.log()

  // Fetch a sample restaurant to see rating fields
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('📊 RATING-RELATED FIELDS IN DATABASE:')
  console.log()

  const ratingFields = Object.keys(restaurant).filter(key =>
    key.includes('rating') ||
    key.includes('review') ||
    key.includes('score')
  )

  ratingFields.forEach(field => {
    console.log(`   ${field}: ${typeof restaurant[field]} = ${JSON.stringify(restaurant[field])}`)
  })

  console.log()
  console.log('=' .repeat(80))
  console.log('SAMPLE RESTAURANT RATING DATA:')
  console.log('=' .repeat(80))
  console.log()
  console.log(`Restaurant: ${restaurant.name}`)
  console.log(`Slug: ${restaurant.slug}`)
  console.log()

  // Check various rating sources
  console.log('📍 Google:')
  console.log(`   Rating: ${restaurant.google_rating || 'N/A'}`)
  console.log(`   Reviews: ${restaurant.google_review_count || 'N/A'}`)
  console.log()

  console.log('📍 TripAdvisor:')
  console.log(`   Rating: ${restaurant.tripadvisor_rating || 'N/A'}`)
  console.log(`   Reviews: ${restaurant.tripadvisor_review_count || 'N/A'}`)
  console.log()

  console.log('📍 Overall:')
  console.log(`   Average Rating: ${restaurant.average_rating || 'N/A'}`)
  console.log(`   Review Count: ${restaurant.review_count || 'N/A'}`)
  console.log()

  console.log('📍 Rating Breakdown:')
  if (restaurant.rating_breakdown) {
    console.log(JSON.stringify(restaurant.rating_breakdown, null, 2))
  } else {
    console.log('   Not available')
  }
  console.log()

  console.log('📍 Overall Rating:')
  console.log(`   ${restaurant.overall_rating || 'N/A'}`)
  console.log()

  // Check how many restaurants have rating breakdowns
  const { count } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .not('rating_breakdown', 'is', null)

  const { count: totalCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })

  console.log('=' .repeat(80))
  console.log('RATING BREAKDOWN COVERAGE:')
  console.log('=' .repeat(80))
  console.log(`   Restaurants with rating_breakdown: ${count || 0}`)
  console.log(`   Total restaurants: ${totalCount || 0}`)
  console.log(`   Coverage: ${count && totalCount ? Math.round((count / totalCount) * 100) : 0}%`)
  console.log()
}

checkRatingFields().catch(console.error)
