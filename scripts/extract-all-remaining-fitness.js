/**
 * Extract All Remaining Fitness Places (Option A)
 * 
 * 1. Activates inactive places with missing types
 * 2. Extracts all places that need extraction
 * 3. Processes in batches with progress tracking
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

const MISSING_TYPES = ['boxing', 'cycling', 'swimming', 'personal-training']

async function extractAllRemaining() {
  console.log('\nðŸ‹ï¸  EXTRACT ALL REMAINING FITNESS PLACES (Option A)')
  console.log('='.repeat(70) + '\n')

  // Step 1: Find inactive places with missing types and activate them
  console.log('ðŸ“‹ Step 1: Activating inactive places with missing types...\n')
  
  const { data: inactiveWithMissingTypes } = await supabase
    .from('fitness_places')
    .select('id, name, slug, fitness_types, active')
    .eq('active', false)

  const placesToActivate = inactiveWithMissingTypes?.filter(fp => {
    if (!fp.fitness_types || fp.fitness_types.length === 0) return false
    return fp.fitness_types.some(type => MISSING_TYPES.includes(type))
  }) || []

  if (placesToActivate.length > 0) {
    console.log(`Found ${placesToActivate.length} inactive places with missing types:`)
    placesToActivate.forEach((fp, i) => {
      const types = fp.fitness_types?.join(', ') || 'Unknown'
      console.log(`   ${i + 1}. ${fp.name} (${types})`)
    })

    // Activate them
    const idsToActivate = placesToActivate.map(fp => fp.id)
    const { error: activateError } = await supabase
      .from('fitness_places')
      .update({ active: true })
      .in('id', idsToActivate)

    if (activateError) {
      console.error('âŒ Error activating places:', activateError)
    } else {
      console.log(`\nâœ… Activated ${placesToActivate.length} places\n`)
    }
  } else {
    console.log('âœ… No inactive places with missing types found\n')
  }

  // Step 2: Find all places needing extraction
  console.log('ðŸ“‹ Step 2: Finding all places needing extraction...\n')

  const { data: allPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, area, google_rating, google_review_count, google_place_id, extraction_status, description, fitness_types')
    .eq('active', true)
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .order('google_review_count', { ascending: false })

  if (error) {
    console.error('âŒ Error fetching fitness places:', error)
    process.exit(1)
  }

  // Filter places that need extraction
  const needsExtraction = allPlaces?.filter(fp => 
    !fp.description || 
    fp.extraction_status !== 'completed'
  ) || []

  console.log(`Total active places: ${allPlaces?.length || 0}`)
  console.log(`Places needing extraction: ${needsExtraction.length}\n`)

  if (needsExtraction.length === 0) {
    console.log('âœ… All active places are already extracted!')
    console.log('\nðŸ’¡ To add more places for missing types:')
    console.log('   1. Use admin panel: /admin/fitness/add')
    console.log('   2. Search Google Places for:')
    MISSING_TYPES.forEach(type => {
      const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
      console.log(`      - "${name} Goa"`)
      console.log(`      - "${name} gym Goa"`)
    })
    console.log('   3. Or import from CSV if you have a list')
    return
  }

  // Show breakdown by type
  console.log('ðŸ“Š BREAKDOWN BY FITNESS TYPE:')
  console.log('-'.repeat(70))
  
  const typeBreakdown = {}
  needsExtraction.forEach(fp => {
    const types = fp.fitness_types || []
    if (types.length === 0) {
      types.push('unknown')
    }
    types.forEach(type => {
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = []
      }
      typeBreakdown[type].push(fp)
    })
  })

  Object.entries(typeBreakdown)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, places]) => {
      const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
      console.log(`${name.padEnd(20)}: ${places.length} places`)
    })

  // Step 3: Extraction configuration
  const BATCH_SIZE = 5
  const DELAY_BETWEEN_ITEMS = 2000
  const DELAY_BETWEEN_BATCHES = 10000

  console.log(`\n\nâš™ï¸  EXTRACTION CONFIGURATION`)
  console.log('-'.repeat(70))
  console.log(`Places to extract: ${needsExtraction.length}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`Delay between items: ${DELAY_BETWEEN_ITEMS / 1000}s`)
  console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`)
  console.log(`Estimated cost: ~$${(needsExtraction.length * 0.22).toFixed(2)}`)
  console.log(`Estimated time: ~${Math.ceil(needsExtraction.length * 5 / 60)} minutes\n`)

  // Step 4: Confirm before proceeding
  console.log('ðŸš€ Starting extraction...\n')

  let successCount = 0
  let errorCount = 0
  const errors = []

  // Process in batches
  for (let i = 0; i < needsExtraction.length; i += BATCH_SIZE) {
    const batch = needsExtraction.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(needsExtraction.length / BATCH_SIZE)

    console.log(`\n${'='.repeat(70)}`)
    console.log(`ðŸ“¦ BATCH ${batchNum}/${totalBatches} (Places ${i + 1}-${Math.min(i + BATCH_SIZE, needsExtraction.length)})`)
    console.log('='.repeat(70))

    for (const fp of batch) {
      const currentNum = needsExtraction.indexOf(fp) + 1
      const types = fp.fitness_types?.join(', ') || 'Unknown'
      console.log(`\n[${currentNum}/${needsExtraction.length}] ðŸ‹ï¸  ${fp.name}`)
      console.log(`   Types: ${types}`)
      console.log(`   Area: ${fp.area}`)
      console.log(`   Google: ${fp.google_rating}â­ (${fp.google_review_count} reviews)`)

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
        console.log(`   âœ… Extraction started: ${result.message || 'Success'}`)
        successCount++

        // Wait between individual extractions
        if (needsExtraction.indexOf(fp) < needsExtraction.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ITEMS))
        }

      } catch (error) {
        console.error(`   âŒ Error: ${error.message}`)
        errorCount++
        errors.push({ name: fp.name, error: error.message })
      }
    }

    // Wait between batches (except for last batch)
    if (i + BATCH_SIZE < needsExtraction.length) {
      console.log(`\nâ¸ï¸  Batch complete. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  // Final summary
  console.log('\n\n' + '='.repeat(70))
  console.log('ðŸŽ‰ EXTRACTION COMPLETE')
  console.log('='.repeat(70))
  console.log(`âœ… Success: ${successCount}/${needsExtraction.length}`)
  console.log(`âŒ Errors: ${errorCount}/${needsExtraction.length}`)

  if (errors.length > 0) {
    console.log('\nâš ï¸  Failed extractions:')
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.name}: ${err.error}`)
    })
  }

  // Check for missing types
  const { data: finalCheck } = await supabase
    .from('fitness_places')
    .select('fitness_types')
    .eq('active', true)

  const activeTypes = new Set()
  finalCheck?.forEach(fp => {
    fp.fitness_types?.forEach(type => activeTypes.add(type))
  })

  const stillMissing = MISSING_TYPES.filter(type => !activeTypes.has(type))

  if (stillMissing.length > 0) {
    console.log('\n\nâš ï¸  MISSING TYPES STILL NOT REPRESENTED:')
    console.log('-'.repeat(70))
    stillMissing.forEach(type => {
      const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
      console.log(`   âŒ ${name}`)
    })
    console.log('\nðŸ’¡ To add places for these types:')
    console.log('   1. Use admin panel: /admin/fitness/add')
    console.log('   2. Search Google Places API for:')
    stillMissing.forEach(type => {
      const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
      console.log(`      - "${name} Goa"`)
    })
  } else {
    console.log('\n\nâœ… All fitness types are now represented!')
  }

  console.log('\nðŸ’¡ Next Steps:')
  console.log('   1. Monitor extraction progress in admin panel: /admin/fitness/queue')
  console.log('   2. Check extraction status: node scripts/check-extraction-status.js')
  console.log('   3. Once complete, verify all types show up on /things-to-do/fitness')
  console.log('')
}

extractAllRemaining()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })




























