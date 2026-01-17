/**
 * Re-run AI Enhancement for All Fitness Places
 * 
 * This script re-runs the AI enhancement step (Step 6) for all active fitness places
 * to get accurate category suggestions. It will:
 * 1. Re-run AI enhancement which generates suggested_categories
 * 2. Update fitness_types with AI suggestions
 * 3. Re-run category matching to update fitness_category_ids
 * 
 * Note: This uses the rerun endpoint which will re-run the full extraction,
 * but it should skip steps that already have data (Apify, Firecrawl, images)
 * and focus on AI enhancement and category matching.
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

async function rerunAIEnhancement() {
  console.log('\n🤖 RE-RUNNING AI ENHANCEMENT FOR ALL FITNESS PLACES')
  console.log('='.repeat(70) + '\n')

  // Get all active fitness places
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, area, google_rating, google_review_count, extraction_status')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('❌ Error fetching fitness places:', error)
    process.exit(1)
  }

  console.log(`Found ${fitnessPlaces?.length || 0} active fitness places\n`)

  // Batch configuration
  const BATCH_SIZE = 5
  const DELAY_BETWEEN_ITEMS = 3000 // 3 seconds between items
  const DELAY_BETWEEN_BATCHES = 15000 // 15 seconds between batches

  console.log('⚙️  CONFIGURATION')
  console.log('-'.repeat(70))
  console.log(`Places to process: ${fitnessPlaces?.length || 0}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`Delay between items: ${DELAY_BETWEEN_ITEMS / 1000}s`)
  console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`)
  console.log(`Estimated cost: ~$${((fitnessPlaces?.length || 0) * 0.22).toFixed(2)}`)
  console.log(`Estimated time: ~${Math.ceil((fitnessPlaces?.length || 0) * 5 / 60)} minutes\n`)

  console.log('🚀 Starting AI enhancement re-run...\n')

  let successCount = 0
  let errorCount = 0
  const errors = []

  // Process in batches
  for (let i = 0; i < (fitnessPlaces?.length || 0); i += BATCH_SIZE) {
    const batch = fitnessPlaces?.slice(i, i + BATCH_SIZE) || []
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil((fitnessPlaces?.length || 0) / BATCH_SIZE)

    console.log(`\n${'='.repeat(70)}`)
    console.log(`📦 BATCH ${batchNum}/${totalBatches} (Places ${i + 1}-${Math.min(i + BATCH_SIZE, fitnessPlaces?.length || 0)})`)
    console.log('='.repeat(70))

    for (const fp of batch) {
      const currentNum = (fitnessPlaces?.indexOf(fp) || 0) + 1
      console.log(`\n[${currentNum}/${fitnessPlaces?.length || 0}] 🤖 ${fp.name}`)
      console.log(`   Area: ${fp.area}`)
      console.log(`   Google: ${fp.google_rating || 'N/A'}⭐ (${fp.google_review_count || 0} reviews)`)

      try {
        // Reset extraction status to allow re-running
        await supabase
          .from('fitness_places')
          .update({
            extraction_status: 'pending',
            extraction_progress: null
          })
          .eq('id', fp.id)

        // Call the RE-RUN extraction API endpoint
        // This will re-run the full extraction, but should skip steps with existing data
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
        console.log(`   ✅ AI enhancement started: ${result.message || 'Success'}`)
        successCount++

        // Wait between individual extractions
        if ((fitnessPlaces?.indexOf(fp) || 0) < (fitnessPlaces?.length || 0) - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ITEMS))
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)
        errorCount++
        errors.push({ name: fp.name, error: error.message })
      }
    }

    // Wait between batches (except for last batch)
    if (i + BATCH_SIZE < (fitnessPlaces?.length || 0)) {
      console.log(`\n⏸️  Batch complete. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  // Final summary
  console.log('\n\n' + '='.repeat(70))
  console.log('🎉 AI ENHANCEMENT RE-RUN COMPLETE')
  console.log('='.repeat(70))
  console.log(`✅ Success: ${successCount}/${fitnessPlaces?.length || 0}`)
  console.log(`❌ Errors: ${errorCount}/${fitnessPlaces?.length || 0}`)

  if (errors.length > 0) {
    console.log('\n⚠️  Failed extractions:')
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.name}: ${err.error}`)
    })
  }

  console.log('\n💡 Next Steps:')
  console.log('   1. Wait for extractions to complete (check in ~4 hours)')
  console.log('   2. Monitor progress: /admin/fitness/queue')
  console.log('   3. Once complete, run: node scripts/check-fitness-categories.js')
  console.log('   4. Verify category distribution has improved')
  console.log('')
}

rerunAIEnhancement()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })




























