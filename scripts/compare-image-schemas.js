import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function compareImageSchemas() {
  // Get Cultural Centre images
  const { data: attraction } = await supabase
    .from('attractions')
    .select('id')
    .eq('slug', 'sheikh-abdullah-al-salem-cultural-centre-salmiya')
    .single()

  const { data: attractionImages } = await supabase
    .from('attraction_images')
    .select('url, alt_text, type, source, metadata')
    .eq('attraction_id', attraction.id)
    .limit(3)

  console.log('=== ATTRACTION IMAGES (Cultural Centre) ===')
  attractionImages.forEach((img, i) => {
    console.log(`${i + 1}. Type: ${img.type || 'null'}`)
    console.log(`   Alt text: ${img.alt_text}`)
    console.log(`   Source: ${img.source}`)
    console.log(`   Metadata:`, JSON.stringify(img.metadata, null, 2))
    console.log('')
  })

  // Get a restaurant's images for comparison
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1)
    .single()

  if (restaurant) {
    const { data: restaurantImages } = await supabase
      .from('restaurant_images')
      .select('url, alt_text, image_type, source, metadata')
      .eq('restaurant_id', restaurant.id)
      .limit(3)

    console.log('=== RESTAURANT IMAGES (for comparison) ===')
    restaurantImages?.forEach((img, i) => {
      console.log(`${i + 1}. Type: ${img.image_type || 'null'}`)
      console.log(`   Alt text: ${img.alt_text}`)
      console.log(`   Source: ${img.source}`)
      console.log(`   Metadata:`, JSON.stringify(img.metadata, null, 2))
      console.log('')
    })
  }

  // Check hotel images too
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .limit(1)
    .single()

  if (hotel) {
    const { data: hotelImages } = await supabase
      .from('hotel_images')
      .select('url, alt_text, image_type, source, metadata')
      .eq('hotel_id', hotel.id)
      .limit(3)

    console.log('=== HOTEL IMAGES (for comparison) ===')
    hotelImages?.forEach((img, i) => {
      console.log(`${i + 1}. Type: ${img.image_type || 'null'}`)
      console.log(`   Alt text: ${img.alt_text}`)
      console.log(`   Source: ${img.source}`)
      console.log(`   Metadata:`, JSON.stringify(img.metadata, null, 2))
      console.log('')
    })
  }
}

compareImageSchemas().catch(console.error)
