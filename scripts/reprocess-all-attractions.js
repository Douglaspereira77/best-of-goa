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

async function reprocessAllAttractions() {
  console.log('🚀 Batch reprocessing all attraction images with Vision AI\n')
  console.log('━'.repeat(70))

  // Get all attractions
  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('id, name, slug')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error || !attractions) {
    console.error('Error fetching attractions:', error)
    process.exit(1)
  }

  console.log(`Found ${attractions.length} attractions to process\n`)

  const extractor = getAttractionImageExtractor()
  const results = {
    total: attractions.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }

  for (let i = 0; i < attractions.length; i++) {
    const attraction = attractions[i]
    const progress = `[${i + 1}/${attractions.length}]`

    console.log(`\n${progress} Processing: ${attraction.name}`)
    console.log(`Slug: ${attraction.slug}`)

    try {
      // Check if attraction has images
      const { count } = await supabase
        .from('attraction_images')
        .select('*', { count: 'exact', head: true })
        .eq('attraction_id', attraction.id)

      if (!count || count === 0) {
        console.log(`⏭️  Skipped (no images)`)
        results.skipped++
        continue
      }

      console.log(`📸 Found ${count} images to reprocess`)

      // Reprocess with AI
      await extractor.reprocessExistingImagesWithAI(attraction.id)

      console.log(`✅ Success!`)
      results.successful++

    } catch (error) {
      console.error(`❌ Failed:`, error.message)
      results.failed++
      results.errors.push({
        name: attraction.name,
        slug: attraction.slug,
        error: error.message
      })
    }

    // Small delay to avoid rate limiting
    if (i < attractions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Summary
  console.log('\n' + '━'.repeat(70))
  console.log('\n📊 BATCH PROCESSING SUMMARY\n')
  console.log(`Total Attractions: ${results.total}`)
  console.log(`✅ Successful: ${results.successful}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏭️  Skipped (no images): ${results.skipped}`)

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach(err => {
      console.log(`  - ${err.name} (${err.slug}): ${err.error}`)
    })
  }

  console.log('\n' + '━'.repeat(70))
  console.log('\n✅ Batch processing complete!')

  // Estimated cost
  const imagesProcessed = results.successful * 10 // Assuming ~10 images per attraction
  const estimatedCost = imagesProcessed * 0.01
  console.log(`\n💰 Estimated Vision API cost: $${estimatedCost.toFixed(2)}`)
}

reprocessAllAttractions().catch(console.error)
