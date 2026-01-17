import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMuroujData() {
  console.log('Checking Murouj Food Complex data...\n')

  // Get main attraction record
  const { data: attraction, error: attractionError } = await supabase
    .from('attractions')
    .select('*')
    .eq('slug', 'murouj-food-complex-subhan-area')
    .single()

  if (attractionError) {
    console.error('Error fetching attraction:', attractionError)
    return
  }

  console.log('=== MAIN ATTRACTION RECORD ===')
  console.log('ID:', attraction.id)
  console.log('Name:', attraction.name)
  console.log('Description length:', attraction.description?.length || 0)
  console.log('Long description length:', attraction.long_description?.length || 0)
  console.log('Specialties:', attraction.specialties)
  console.log('Hero image:', attraction.hero_image)
  console.log('Instagram:', attraction.instagram)
  console.log('Facebook:', attraction.facebook)
  console.log('TikTok:', attraction.tiktok)
  console.log('')

  // Get images
  const { data: images, error: imagesError } = await supabase
    .from('attraction_images')
    .select('*')
    .eq('attraction_id', attraction.id)
    .order('display_order')

  console.log('=== IMAGES ===')
  console.log('Count:', images?.length || 0)
  if (images && images.length > 0) {
    console.log('Sample image object:', JSON.stringify(images[0], null, 2))
    images.forEach((img, i) => {
      console.log(`${i + 1}. ${img.image_type || 'No type'}: ${img.url || img.image_url || img.storage_url || 'No URL'}`)
      console.log(`   Is hero: ${img.is_hero}`)
    })
  }
  console.log('')

  // Get FAQs
  const { data: faqs, error: faqsError } = await supabase
    .from('attraction_faqs')
    .select('*')
    .eq('attraction_id', attraction.id)
    .order('display_order')

  console.log('=== FAQs ===')
  console.log('Count:', faqs?.length || 0)
  if (faqs && faqs.length > 0) {
    faqs.forEach((faq, i) => {
      console.log(`${i + 1}. ${faq.question}`)
      console.log(`   ${faq.answer}`)
    })
  }
  console.log('')

  // Get reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from('attraction_reviews')
    .select('*')
    .eq('attraction_id', attraction.id)
    .order('created_at', { ascending: false })

  console.log('=== REVIEWS ===')
  console.log('Count:', reviews?.length || 0)
  if (reviews && reviews.length > 0) {
    console.log('Sample review object:', JSON.stringify(reviews[0], null, 2))
    reviews.slice(0, 5).forEach((review, i) => {
      console.log(`${i + 1}. Rating: ${review.rating}/5 by ${review.author_name}`)
      console.log(`   ${review.text || review.review_text || review.content || 'No text'}`.substring(0, 100))
    })
  }
}

checkMuroujData().catch(console.error)