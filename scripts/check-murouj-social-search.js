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

async function checkSocialMediaSearch() {
  console.log('Checking social media search results for Murouj...\n')

  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('name, area, website, firecrawl_output, instagram, facebook, tiktok, twitter')
    .eq('slug', 'murouj-food-complex-subhan-area')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('=== ATTRACTION INFO ===')
  console.log('Name:', attraction.name)
  console.log('Area:', attraction.area)
  console.log('Website:', attraction.website)
  console.log('')

  console.log('=== SOCIAL MEDIA FIELDS (in database) ===')
  console.log('Instagram:', attraction.instagram)
  console.log('Facebook:', attraction.facebook)
  console.log('TikTok:', attraction.tiktok)
  console.log('Twitter:', attraction.twitter)
  console.log('')

  console.log('=== FIRECRAWL OUTPUT ===')
  if (attraction.firecrawl_output) {
    console.log('Available keys:', Object.keys(attraction.firecrawl_output))

    if (attraction.firecrawl_output.social_media_search) {
      console.log('\n=== SOCIAL MEDIA SEARCH RESULTS ===')
      console.log(JSON.stringify(attraction.firecrawl_output.social_media_search, null, 2))
    } else {
      console.log('No social_media_search results found in firecrawl_output')
    }

    if (attraction.firecrawl_output.website_scrape) {
      console.log('\n=== WEBSITE SCRAPE AVAILABLE ===')
      const scrape = attraction.firecrawl_output.website_scrape
      if (scrape.markdown) {
        console.log('Markdown length:', scrape.markdown.length)
        // Check if markdown contains social media links
        const hasInstagram = scrape.markdown.includes('instagram.com')
        const hasFacebook = scrape.markdown.includes('facebook.com')
        const hasTiktok = scrape.markdown.includes('tiktok.com')
        console.log('Contains Instagram links:', hasInstagram)
        console.log('Contains Facebook links:', hasFacebook)
        console.log('Contains TikTok links:', hasTiktok)
      }
    }
  } else {
    console.log('No firecrawl_output found')
  }
}

checkSocialMediaSearch().catch(console.error)
