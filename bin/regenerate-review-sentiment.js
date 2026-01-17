/**
 * Regenerate review_sentiment for restaurants with generic/bad sentiment
 * This fixes restaurants that have "While there are no specific customer reviews available..."
 */

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

async function analyzeReviewSentiment(reviews) {
  try {
    if (!reviews || reviews.length === 0) {
      return null
    }

    console.log(`      Analyzing ${reviews.length} reviews...`)

    const reviewsText = reviews.slice(0, 10).map(r => r.text || r.review).join('\n\n')

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
    console.error('      ❌ Sentiment analysis failed:', error.message)
    return null
  }
}

async function regenerateSentiment() {
  console.log('=' .repeat(80))
  console.log('REGENERATING REVIEW_SENTIMENT FOR RESTAURANTS')
  console.log('=' .repeat(80))
  console.log()

  // Find restaurants with generic sentiment or no sentiment but have reviews
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, review_sentiment, apify_output, google_review_count, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 Checking ${restaurants.length} restaurants\n`)

  const badSentimentPattern = /while there are no specific (customer )?reviews available/i
  const needsRegeneration = restaurants.filter(r => {
    const hasGenericSentiment = badSentimentPattern.test(r.review_sentiment || '')
    const hasNoSentiment = !r.review_sentiment || r.review_sentiment.trim().length === 0
    const hasReviews = (r.apify_output?.reviews || []).length > 0

    return hasReviews && (hasGenericSentiment || hasNoSentiment)
  })

  console.log(`🔍 Found ${needsRegeneration.length} restaurants needing regeneration\n`)

  if (needsRegeneration.length === 0) {
    console.log('✅ All restaurants have proper review sentiment!\n')
    return
  }

  let successCount = 0
  let failCount = 0

  for (const restaurant of needsRegeneration) {
    const reviews = restaurant.apify_output?.reviews || []

    console.log(`🔧 ${restaurant.name}`)
    console.log(`   Google Review Count: ${restaurant.google_review_count}`)
    console.log(`   Apify Reviews: ${reviews.length}`)
    console.log(`   Current: "${(restaurant.review_sentiment || 'EMPTY').substring(0, 80)}..."`)

    const newSentiment = await analyzeReviewSentiment(reviews)

    if (newSentiment) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          review_sentiment: newSentiment,
          review_sentiment_updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id)

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
        failCount++
      } else {
        console.log(`   ✅ New: "${newSentiment.substring(0, 80)}..."`)
        successCount++
      }
    } else {
      console.log(`   ⚠️  Skipped (no sentiment generated)`)
      failCount++
    }

    console.log()
  }

  console.log('=' .repeat(80))
  console.log('SUMMARY:')
  console.log(`   Total needing regeneration: ${needsRegeneration.length}`)
  console.log(`   Successfully updated: ${successCount}`)
  console.log(`   Failed: ${failCount}`)
  console.log('=' .repeat(80))
}

regenerateSentiment().catch(console.error)
