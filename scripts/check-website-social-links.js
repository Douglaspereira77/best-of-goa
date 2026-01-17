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

async function checkWebsiteSocialLinks() {
  const { data: attraction } = await supabase
    .from('attractions')
    .select('name, website, firecrawl_output')
    .eq('slug', 'murouj-food-complex-subhan-area')
    .single()

  console.log('Checking website for social media links...\n')
  console.log('Website:', attraction.website)
  console.log('')

  console.log('Firecrawl output keys:', attraction.firecrawl_output ? Object.keys(attraction.firecrawl_output) : 'null')
  console.log('Website scrape:', attraction.firecrawl_output?.website_scrape ? 'exists' : 'missing')
  console.log('')

  if (attraction.firecrawl_output?.website_scrape) {
    const websiteScrape = attraction.firecrawl_output.website_scrape
    console.log('Website scrape data keys:', Object.keys(websiteScrape))

    const markdown = websiteScrape.markdown || websiteScrape.data?.markdown || websiteScrape.content

    if (!markdown) {
      console.log('❌ No markdown content found in website scrape')
      console.log('Website scrape structure:', JSON.stringify(websiteScrape, null, 2).substring(0, 500))
      return
    }

    console.log('=== WEBSITE MARKDOWN CONTENT ===')
    console.log('Total length:', markdown.length, 'characters')
    console.log('')

    // Search for social media links
    const socialPatterns = [
      { platform: 'Instagram', regex: /instagram\.com\/[^\s\)"\]]+/gi },
      { platform: 'Facebook', regex: /facebook\.com\/[^\s\)"\]]+/gi },
      { platform: 'TikTok', regex: /tiktok\.com\/[^\s\)"\]]+/gi },
      { platform: 'Twitter/X', regex: /(twitter|x)\.com\/[^\s\)"\]]+/gi },
      { platform: 'YouTube', regex: /youtube\.com\/[^\s\)"\]]+/gi },
      { platform: 'LinkedIn', regex: /linkedin\.com\/[^\s\)"\]]+/gi },
    ]

    console.log('=== SOCIAL MEDIA LINKS FOUND IN MARKDOWN ===')
    let foundAny = false

    for (const { platform, regex } of socialPatterns) {
      const matches = markdown.match(regex)
      if (matches && matches.length > 0) {
        foundAny = true
        console.log(`\n${platform}:`)
        matches.forEach((match, i) => {
          console.log(`  ${i + 1}. https://${match}`)
        })
      }
    }

    if (!foundAny) {
      console.log('❌ No social media links found in website markdown')

      // Show a sample of the markdown to understand what was scraped
      console.log('\n=== MARKDOWN SAMPLE (first 2000 chars) ===')
      console.log(markdown.substring(0, 2000))
      console.log('\n...')
      console.log('\n=== MARKDOWN SAMPLE (last 1000 chars) ===')
      console.log(markdown.substring(markdown.length - 1000))
    }
  } else {
    console.log('❌ No website scrape data found')
  }
}

checkWebsiteSocialLinks().catch(console.error)
