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

async function checkLeila() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, review_sentiment, google_review_count, apify_output')
    .eq('slug', 'leila-min-lebnen-the-avenues')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Restaurant:', data.name)
  console.log('ID:', data.id)
  console.log('\n=== REVIEW SENTIMENT ===')
  console.log(data.review_sentiment)
  console.log('\n=== GOOGLE REVIEW COUNT ===')
  console.log(data.google_review_count)
  console.log('\n=== APIFY REVIEWS ===')
  const reviews = data.apify_output?.reviews || []
  console.log(`Found ${reviews.length} reviews in apify_output`)

  if (reviews.length > 0) {
    console.log('\nFirst 3 reviews:')
    reviews.slice(0, 3).forEach((r, i) => {
      console.log(`${i + 1}. ${r.name || 'Anonymous'} (${r.stars} stars)`)
      console.log(`   "${r.text?.substring(0, 100) || 'No text'}..."`)
      console.log(`   Date: ${r.publishedAtDate}`)
      console.log()
    })
  }
}

checkLeila().catch(console.error)
