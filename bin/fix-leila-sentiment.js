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

    console.log(`   Analyzing ${reviews.length} reviews...`)

    // Filter reviews that have actual text
    const reviewsWithText = reviews.filter(r => {
      const text = r.text || r.review || ''
      return text.trim().length > 0
    })

    console.log(`   Found ${reviewsWithText.length} reviews with text content`)

    if (reviewsWithText.length === 0) {
      console.log('   ⚠️  No reviews have text content')
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
    console.error('   ❌ Sentiment analysis failed:', error.message)
    return null
  }
}

async function fixLeila() {
  console.log('=' .repeat(80))
  console.log('FIXING LEILA MIN LEBNEN REVIEW SENTIMENT')
  console.log('=' .repeat(80))
  console.log()

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, review_sentiment, apify_output, google_review_count')
    .eq('slug', 'leila-min-lebnen-the-avenues')
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`🔧 ${restaurant.name}`)
  console.log(`   Google Review Count: ${restaurant.google_review_count}`)

  const reviews = restaurant.apify_output?.reviews || []
  console.log(`   Apify Reviews: ${reviews.length}`)
  console.log(`   Current Sentiment: "${restaurant.review_sentiment?.substring(0, 80)}..."`)
  console.log()

  const newSentiment = await analyzeReviewSentiment(reviews)

  if (newSentiment) {
    console.log()
    console.log(`   ✅ Generated New Sentiment:`)
    console.log(`   "${newSentiment}"`)
    console.log()

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        review_sentiment: newSentiment
      })
      .eq('id', restaurant.id)

    if (updateError) {
      console.log(`   ❌ Failed to update: ${updateError.message}`)
    } else {
      console.log(`   ✅ Successfully updated database!`)
      console.log()
      console.log('   View updated page at:')
      console.log('   http://localhost:3000/places-to-eat/restaurants/leila-min-lebnen-the-avenues')
    }
  } else {
    console.log(`   ⚠️  Could not generate sentiment`)
  }

  console.log()
  console.log('=' .repeat(80))
}

fixLeila().catch(console.error)
