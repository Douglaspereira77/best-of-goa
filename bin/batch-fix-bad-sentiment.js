import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

async function analyzeReviewSentiment(reviews) {
  try {
    if (!reviews || reviews.length === 0) {
      return null
    }

    // Filter reviews that have actual text
    const reviewsWithText = reviews.filter(r => {
      const text = r.text || r.review || ''
      return text.trim().length > 0
    })

    if (reviewsWithText.length === 0) {
      return null
    }

    const reviewsText = reviewsWithText.slice(0, 10).map(r => {
      const text = r.text || r.review
      const stars = r.stars || r.rating || 'N/A'
      return `[${stars} stars] ${text}`
    }).join('\n\n')

    const prompt = `Analyze the sentiment of these restaurant reviews and provide a brief 200-300 character summary of what customers love most and any common concerns:

Reviews:
${reviewsText}

Provide ONLY the sentiment summary, no additional text.`

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 300,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content returned from GPT-4o mini')
    }

    return content.trim()

  } catch (error) {
    console.error(`      ❌ Error: ${error.message}`)
    return null
  }
}

async function batchFix() {
  console.log('=' .repeat(80))
  console.log('BATCH FIXING BAD REVIEW SENTIMENT')
  console.log('=' .repeat(80))
  console.log()

  // Load the list of problematic restaurants
  const listPath = join(__dirname, '..', 'bad-sentiment-restaurants.json')

  if (!fs.existsSync(listPath)) {
    console.log('❌ bad-sentiment-restaurants.json not found!')
    console.log('   Please run: node bin/find-bad-sentiment.js first')
    return
  }

  const problematic = JSON.parse(fs.readFileSync(listPath, 'utf8'))

  console.log(`📋 Loaded ${problematic.length} restaurants from bad-sentiment-restaurants.json`)
  console.log()

  let successCount = 0
  let failCount = 0
  let skippedCount = 0

  for (let i = 0; i < problematic.length; i++) {
    const entry = problematic[i]

    console.log(`[${i + 1}/${problematic.length}] ${entry.name}`)
    console.log(`   Slug: ${entry.slug}`)
    console.log(`   Reviews: ${entry.totalReviews} (${entry.textReviews} with text)`)
    console.log(`   Current: "${entry.sentiment}..."`)

    // Fetch fresh data from database
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('id, apify_output')
      .eq('id', entry.id)
      .single()

    if (error) {
      console.log(`   ❌ Failed to fetch: ${error.message}`)
      failCount++
      console.log()
      continue
    }

    const reviews = restaurant.apify_output?.reviews || []

    if (reviews.length === 0) {
      console.log(`   ⚠️  Skipped: No reviews in database`)
      skippedCount++
      console.log()
      continue
    }

    console.log(`   🤖 Analyzing sentiment...`)
    const newSentiment = await analyzeReviewSentiment(reviews)

    if (newSentiment) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          review_sentiment: newSentiment
        })
        .eq('id', entry.id)

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
        failCount++
      } else {
        console.log(`   ✅ Updated: "${newSentiment.substring(0, 80)}..."`)
        successCount++
      }
    } else {
      console.log(`   ⚠️  Skipped: Could not generate sentiment`)
      skippedCount++
    }

    console.log()

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('=' .repeat(80))
  console.log('SUMMARY:')
  console.log(`   Total processed: ${problematic.length}`)
  console.log(`   ✅ Successfully updated: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   ⚠️  Skipped: ${skippedCount}`)
  console.log('=' .repeat(80))
  console.log()
  console.log('💡 Test updated pages at:')
  console.log('   http://localhost:3000/places-to-eat/restaurants/[slug]')
  console.log()
}

batchFix().catch(console.error)
