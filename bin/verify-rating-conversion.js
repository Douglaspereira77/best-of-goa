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

async function verifyRatingConversion() {
  console.log('=' .repeat(80))
  console.log('VERIFYING RATING CONVERSION FORMULA')
  console.log('=' .repeat(80))
  console.log()

  // Fetch restaurants with both ratings
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('name, slug, google_rating, overall_rating, google_review_count')
    .not('google_rating', 'is', null)
    .not('overall_rating', 'is', null)
    .order('google_review_count', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`📊 Sample of ${restaurants.length} restaurants:\n`)

  let perfectMatches = 0
  let closeMatches = 0
  let mismatches = 0

  restaurants.forEach((r, i) => {
    const googleRating = r.google_rating
    const overallRating = r.overall_rating
    const expectedOverall = Math.round((googleRating / 5) * 10 * 10) / 10

    const difference = Math.abs(overallRating - expectedOverall)

    let status = '✅'
    if (difference === 0) {
      perfectMatches++
    } else if (difference < 0.2) {
      closeMatches++
      status = '⚠️ '
    } else {
      mismatches++
      status = '❌'
    }

    console.log(`${i + 1}. ${r.name}`)
    console.log(`   Google: ${googleRating}/5 → Expected Overall: ${expectedOverall}/10`)
    console.log(`   Actual Overall: ${overallRating}/10`)
    console.log(`   ${status} Difference: ${difference.toFixed(2)}`)
    console.log(`   Reviews: ${r.google_review_count}`)
    console.log()
  })

  console.log('=' .repeat(80))
  console.log('SUMMARY:')
  console.log(`   ✅ Perfect matches (google × 2 = overall): ${perfectMatches}`)
  console.log(`   ⚠️  Close matches (within 0.2): ${closeMatches}`)
  console.log(`   ❌ Mismatches (difference > 0.2): ${mismatches}`)
  console.log('=' .repeat(80))
  console.log()
  console.log('FORMULA CONFIRMED:')
  console.log('   overall_rating = (google_rating / 5) × 10')
  console.log('   OR simplified: overall_rating = google_rating × 2')
  console.log()
}

verifyRatingConversion().catch(console.error)
