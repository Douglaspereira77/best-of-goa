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

const BATCH_SIZE = 2
const DELAY_BETWEEN_BATCHES = 2000 // 2 seconds
const DELAY_BETWEEN_ATTRACTIONS = 1000 // 1 second

// Attractions to skip (already processed)
const SKIP_SLUGS = [
  'museum-of-modern-art-sharq'
]

async function cleanAndReextractAttraction(attraction) {
  console.log('')
  console.log('━'.repeat(80))
  console.log(`Processing: ${attraction.name}`)
  console.log(`Slug: ${attraction.slug}`)
  console.log('━'.repeat(80))

  try {
    // STEP 1: Delete database records
    const { data: existingImages } = await supabase
      .from('attraction_images')
      .select('id')
      .eq('attraction_id', attraction.id)

    if (existingImages && existingImages.length > 0) {
      console.log(`   🗑️  Deleting ${existingImages.length} database records...`)

      const { error: deleteError } = await supabase
        .from('attraction_images')
        .delete()
        .eq('attraction_id', attraction.id)

      if (deleteError) {
        throw new Error(`Failed to delete database records: ${deleteError.message}`)
      }
      console.log('   ✅ Database records deleted')
    } else {
      console.log('   ℹ️  No existing database records')
    }

    // STEP 2: Delete files from storage
    const storagePath = `attractions/${attraction.slug}/images`
    const { data: files } = await supabase.storage
      .from('attractions')
      .list(storagePath)

    if (files && files.length > 0) {
      console.log(`   🗑️  Deleting ${files.length} storage files...`)

      const filePaths = files.map(f => `${storagePath}/${f.name}`)
      const { error: removeError } = await supabase.storage
        .from('attractions')
        .remove(filePaths)

      if (removeError) {
        console.warn(`   ⚠️  Storage deletion warning: ${removeError.message}`)
      } else {
        console.log('   ✅ Storage files deleted')
      }
    } else {
      console.log('   ℹ️  No existing storage files')
    }

    // STEP 3: Re-extract with Vision AI
    console.log('   🤖 Starting Vision AI extraction...')
    const extractor = getAttractionImageExtractor()
    await extractor.extractAndUploadAttractionImages(attraction.id)

    console.log(`   ✅ SUCCESS: ${attraction.name}`)
    return { success: true, name: attraction.name, slug: attraction.slug }

  } catch (error) {
    console.error(`   ❌ FAILED: ${attraction.name}`)
    console.error(`   Error: ${error.message}`)
    return { success: false, name: attraction.name, slug: attraction.slug, error: error.message }
  }
}

async function batchReextractAttractions() {
  console.log('═'.repeat(80))
  console.log('🔄 BATCH RE-EXTRACTION: All Attractions with Vision AI')
  console.log('═'.repeat(80))
  console.log('')
  console.log(`⚙️  Settings:`)
  console.log(`   - Batch Size: ${BATCH_SIZE}`)
  console.log(`   - Delay Between Batches: ${DELAY_BETWEEN_BATCHES}ms`)
  console.log(`   - Delay Between Attractions: ${DELAY_BETWEEN_ATTRACTIONS}ms`)
  console.log(`   - Skipping: ${SKIP_SLUGS.join(', ')}`)
  console.log('')

  // Get all attractions with images
  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('id, name, slug')
    .order('name')

  if (error) {
    console.error('❌ Failed to fetch attractions:', error)
    process.exit(1)
  }

  // Filter out already processed attractions
  const attractionsToProcess = attractions.filter(a => !SKIP_SLUGS.includes(a.slug))

  console.log(`📊 Found ${attractions.length} total attractions`)
  console.log(`📋 Processing ${attractionsToProcess.length} attractions (${SKIP_SLUGS.length} skipped)`)
  console.log('')

  const results = {
    total: attractionsToProcess.length,
    successful: 0,
    failed: 0,
    errors: []
  }

  // Process in batches
  for (let i = 0; i < attractionsToProcess.length; i += BATCH_SIZE) {
    const batch = attractionsToProcess.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(attractionsToProcess.length / BATCH_SIZE)

    console.log('═'.repeat(80))
    console.log(`📦 BATCH ${batchNumber}/${totalBatches} (Attractions ${i + 1}-${Math.min(i + BATCH_SIZE, attractionsToProcess.length)})`)
    console.log('═'.repeat(80))

    // Process each attraction in the batch sequentially
    for (const attraction of batch) {
      const result = await cleanAndReextractAttraction(attraction)

      if (result.success) {
        results.successful++
      } else {
        results.failed++
        results.errors.push(result)
      }

      // Delay between attractions in same batch
      if (batch.indexOf(attraction) < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ATTRACTIONS))
      }
    }

    // Show batch summary
    console.log('')
    console.log(`✅ Batch ${batchNumber} Complete`)
    console.log(`   Success: ${results.successful}/${results.total}`)
    console.log(`   Failed: ${results.failed}`)
    console.log('')

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < attractionsToProcess.length) {
      console.log(`⏸️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      console.log('')
    }
  }

  // Final Summary
  console.log('')
  console.log('═'.repeat(80))
  console.log('📊 FINAL SUMMARY')
  console.log('═'.repeat(80))
  console.log('')
  console.log(`✅ Successful: ${results.successful}/${results.total}`)
  console.log(`❌ Failed: ${results.failed}/${results.total}`)
  console.log('')

  if (results.errors.length > 0) {
    console.log('❌ Failed Attractions:')
    results.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.name} (${err.slug})`)
      console.log(`      Error: ${err.error}`)
    })
    console.log('')
  }

  console.log('═'.repeat(80))
  console.log('✨ Batch re-extraction complete!')
  console.log('═'.repeat(80))
}

batchReextractAttractions().catch(console.error)
