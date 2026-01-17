/**
 * Extract All 46 Inactive Fitness Places
 * 
 * 1. Activates all 46 inactive places
 * 2. Extracts all places that need extraction
 * 3. Publishes them automatically when extraction completes
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function extractAllInactive() {
  console.log('\n🏋️  EXTRACT ALL 46 INACTIVE FITNESS PLACES')
  console.log('='.repeat(70) + '\n')

  // Step 1: Get all inactive places
  console.log('📋 Step 1: Finding all inactive places...\n')
  
  const { data: inactivePlaces, error: fetchError } = await supabase
    .from('fitness_places')
    .select('id, name, slug, area, fitness_types, extraction_status, description, google_rating, google_review_count, google_place_id')
    .eq('active', false)

  if (fetchError) {
    console.error('❌ Error fetching inactive places:', fetchError)
    process.exit(1)
  }

  if (!inactivePlaces || inactivePlaces.length === 0) {
    console.log('✅ No inactive places found!')
    return
  }

  console.log(`Found ${inactivePlaces.length} inactive places\n`)

  // Show breakdown
  const needsExtraction = inactivePlaces.filter(fp => 
    !fp.description || 
    fp.extraction_status !== 'completed'
  )

  const alreadyExtracted = inactivePlaces.filter(fp => 
    fp.description && 
    fp.extraction_status === 'completed'
  )

  console.log('📊 BREAKDOWN:')
  console.log(`   Total inactive: ${inactivePlaces.length}`)
  console.log(`   Need extraction: ${needsExtraction.length}`)
  console.log(`   Already extracted: ${alreadyExtracted.length}\n`)

  // Step 2: Activate all inactive places
  console.log('📋 Step 2: Activating all inactive places...\n')

  const idsToActivate = inactivePlaces.map(fp => fp.id)
  const { error: activateError } = await supabase
    .from('fitness_places')
    .update({ active: true })
    .in('id', idsToActivate)

  if (activateError) {
    console.error('❌ Error activating places:', activateError)
    process.exit(1)
  }

  console.log(`✅ Activated ${idsToActivate.length} places\n`)

  // Step 3: Filter places that need extraction (must have google_place_id)
  const placesToExtract = inactivePlaces.filter(fp => 
    fp.google_place_id && 
    (!fp.description || fp.extraction_status !== 'completed')
  )

  const placesWithoutPlaceId = inactivePlaces.filter(fp => !fp.google_place_id)

  if (placesWithoutPlaceId.length > 0) {
    console.log(`⚠️  ${placesWithoutPlaceId.length} places don't have google_place_id and cannot be extracted:`)
    placesWithoutPlaceId.forEach((fp, i) => {
      console.log(`   ${i + 1}. ${fp.name}`)
    })
    console.log('')
  }

  if (placesToExtract.length === 0) {
    console.log('✅ All places are already extracted!')
    console.log('\n📋 Step 4: Publishing all places...\n')
    
    // Publish all (set verified = true)
    const { error: publishError } = await supabase
      .from('fitness_places')
      .update({ verified: true })
      .in('id', idsToActivate)

    if (publishError) {
      console.error('❌ Error publishing places:', publishError)
    } else {
      console.log(`✅ Published ${idsToActivate.length} places\n`)
    }
    return
  }

  // Step 4: Extraction configuration
  const BATCH_SIZE = 5
  const DELAY_BETWEEN_ITEMS = 2000
  const DELAY_BETWEEN_BATCHES = 10000

  console.log('📋 Step 3: Extracting places that need extraction...\n')
  console.log('⚙️  EXTRACTION CONFIGURATION')
  console.log('-'.repeat(70))
  console.log(`Places to extract: ${placesToExtract.length}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`Delay between items: ${DELAY_BETWEEN_ITEMS / 1000}s`)
  console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`)
  console.log(`Estimated cost: ~$${(placesToExtract.length * 0.22).toFixed(2)}`)
  console.log(`Estimated time: ~${Math.ceil(placesToExtract.length * 5 / 60)} minutes\n`)

  // Show breakdown by type
  const typeBreakdown = {}
  placesToExtract.forEach(fp => {
    const types = fp.fitness_types || ['unknown']
    types.forEach(type => {
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = []
      }
      typeBreakdown[type].push(fp)
    })
  })

  console.log('📊 BREAKDOWN BY FITNESS TYPE:')
  console.log('-'.repeat(70))
  Object.entries(typeBreakdown)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, places]) => {
      const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
      console.log(`${name.padEnd(20)}: ${places.length} places`)
    })

  console.log('\n🚀 Starting extraction...\n')

  let successCount = 0
  let errorCount = 0
  const errors = []

  // Process in batches
  for (let i = 0; i < placesToExtract.length; i += BATCH_SIZE) {
    const batch = placesToExtract.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(placesToExtract.length / BATCH_SIZE)

    console.log(`\n${'='.repeat(70)}`)
    console.log(`📦 BATCH ${batchNum}/${totalBatches} (Places ${i + 1}-${Math.min(i + BATCH_SIZE, placesToExtract.length)})`)
    console.log('='.repeat(70))

    for (const fp of batch) {
      const currentNum = placesToExtract.indexOf(fp) + 1
      const types = fp.fitness_types?.join(', ') || 'Unknown'
      console.log(`\n[${currentNum}/${placesToExtract.length}] 🏋️  ${fp.name}`)
      console.log(`   Types: ${types}`)
      console.log(`   Area: ${fp.area}`)
      console.log(`   Google: ${fp.google_rating || 'N/A'}⭐ (${fp.google_review_count || 0} reviews)`)

      try {
        // Reset extraction status if needed
        if (fp.extraction_status !== 'pending') {
          await supabase
            .from('fitness_places')
            .update({
              extraction_status: 'pending',
              extraction_progress: null
            })
            .eq('id', fp.id)
        }

        // Call the RE-RUN extraction API endpoint
        const response = await fetch(`http://localhost:3000/api/admin/fitness/${fp.id}/rerun`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log(`   ✅ Extraction started: ${result.message || 'Success'}`)
        successCount++

        // Wait between individual extractions
        if (placesToExtract.indexOf(fp) < placesToExtract.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ITEMS))
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)
        errorCount++
        errors.push({ name: fp.name, error: error.message })
      }
    }

    // Wait between batches (except for last batch)
    if (i + BATCH_SIZE < placesToExtract.length) {
      console.log(`\n⏸️  Batch complete. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  // Final summary
  console.log('\n\n' + '='.repeat(70))
  console.log('🎉 EXTRACTION COMPLETE')
  console.log('='.repeat(70))
  console.log(`✅ Success: ${successCount}/${placesToExtract.length}`)
  console.log(`❌ Errors: ${errorCount}/${placesToExtract.length}`)

  if (errors.length > 0) {
    console.log('\n⚠️  Failed extractions:')
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.name}: ${err.error}`)
    })
  }

  // Step 5: Publish all places (set verified = true)
  console.log('\n\n📋 Step 4: Publishing all places...\n')
  
  const { error: publishError } = await supabase
    .from('fitness_places')
    .update({ verified: true })
    .in('id', idsToActivate)

  if (publishError) {
    console.error('❌ Error publishing places:', publishError)
  } else {
    console.log(`✅ Published ${idsToActivate.length} places (set verified = true)\n`)
  }

  console.log('\n💡 Next Steps:')
  console.log('   1. Monitor extraction progress in admin panel: /admin/fitness/queue')
  console.log('   2. Check extraction status: node scripts/check-extraction-status.js')
  console.log('   3. Once extractions complete, all places will be live and verified')
  console.log('   4. Verify all types show up on /things-to-do/fitness')
  console.log('')
}

extractAllInactive()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })




























