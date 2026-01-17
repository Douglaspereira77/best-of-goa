import { createClient } from '@supabase/supabase-js'
import { getAttractionImageExtractor } from '../src/lib/services/attraction-image-extractor.ts'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function reprocessAttractionImages() {
  const attractionSlug = process.argv[2]

  if (!attractionSlug) {
    console.error('Usage: node scripts/reprocess-attraction-images.js <attraction-slug>')
    console.error('Example: node scripts/reprocess-attraction-images.js sheikh-abdullah-al-salem-cultural-centre-salmiya')
    process.exit(1)
  }

  console.log(`Looking for attraction: ${attractionSlug}\n`)

  // Get attraction ID
  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('id, name')
    .eq('slug', attractionSlug)
    .single()

  if (error || !attraction) {
    console.error('Attraction not found:', error?.message)
    process.exit(1)
  }

  console.log(`Found: ${attraction.name}`)
  console.log(`ID: ${attraction.id}`)
  console.log('')

  const extractor = getAttractionImageExtractor()

  console.log('Starting AI reprocessing...\n')
  await extractor.reprocessExistingImagesWithAI(attraction.id)

  console.log('\n✅ Done! Images updated with AI metadata.')
}

reprocessAttractionImages().catch(console.error)
