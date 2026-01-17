/**
 * Check Fitness AI Enhancement Progress
 * Shows how many places have completed AI enhancement with new category suggestions
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

async function checkProgress() {
  console.log('\n📊 FITNESS AI ENHANCEMENT PROGRESS')
  console.log('='.repeat(70) + '\n')

  // Get all active fitness places
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, extraction_status, extraction_progress, fitness_types, fitness_category_ids')
    .eq('active', true)

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  const total = fitnessPlaces?.length || 0

  // Analyze extraction status
  const statusCounts = {
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
    null: 0
  }

  const statusPlaces = {
    completed: [],
    processing: [],
    pending: [],
    failed: []
  }

  fitnessPlaces?.forEach(fp => {
    const status = fp.extraction_status || 'null'
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++
      if (status !== 'null') {
        statusPlaces[status].push(fp)
      }
    }
  })

  console.log('📋 EXTRACTION STATUS')
  console.log('-'.repeat(70))
  console.log(`✅ Completed: ${statusCounts.completed} (${((statusCounts.completed / total) * 100).toFixed(1)}%)`)
  console.log(`🔄 Processing: ${statusCounts.processing} (${((statusCounts.processing / total) * 100).toFixed(1)}%)`)
  console.log(`⏳ Pending: ${statusCounts.pending} (${((statusCounts.pending / total) * 100).toFixed(1)}%)`)
  console.log(`❌ Failed: ${statusCounts.failed} (${((statusCounts.failed / total) * 100).toFixed(1)}%)`)
  console.log(`❓ No Status: ${statusCounts.null} (${((statusCounts.null / total) * 100).toFixed(1)}%)`)
  console.log('')

  // Check which step places are on
  const stepCounts = {
    apify_fetch: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    firecrawl_website: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    social_media_search: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    apify_reviews: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    process_images: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    ai_enhancement: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    category_matching: { completed: 0, in_progress: 0, pending: 0, failed: 0 },
    calculate_bok_score: { completed: 0, in_progress: 0, pending: 0, failed: 0 }
  }

  fitnessPlaces?.forEach(fp => {
    const progress = fp.extraction_progress || {}
    Object.keys(stepCounts).forEach(step => {
      const stepStatus = progress[step]?.status || 'pending'
      if (stepCounts[step][stepStatus] !== undefined) {
        stepCounts[step][stepStatus]++
      }
    })
  })

  console.log('📊 EXTRACTION STEP PROGRESS')
  console.log('-'.repeat(70))
  Object.entries(stepCounts).forEach(([step, counts]) => {
    const totalStep = counts.completed + counts.in_progress + counts.pending + counts.failed
    const completedPct = totalStep > 0 ? ((counts.completed / total) * 100).toFixed(1) : 0
    const stepName = step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    console.log(`${stepName.padEnd(25)}: ✅ ${counts.completed.toString().padStart(3)} (${completedPct}%) | 🔄 ${counts.in_progress.toString().padStart(3)} | ⏳ ${counts.pending.toString().padStart(3)} | ❌ ${counts.failed.toString().padStart(3)}`)
  })
  console.log('')

  // Check places currently processing
  if (statusPlaces.processing.length > 0) {
    console.log('🔄 PLACES CURRENTLY PROCESSING (first 10):')
    console.log('-'.repeat(70))
    statusPlaces.processing.slice(0, 10).forEach((fp, i) => {
      const progress = fp.extraction_progress || {}
      const currentStep = Object.keys(progress).find(step => 
        progress[step]?.status === 'in_progress'
      ) || 'unknown'
      console.log(`${i + 1}. ${fp.name}`)
      console.log(`   Current step: ${currentStep.replace(/_/g, ' ')}`)
      console.log('')
    })
    if (statusPlaces.processing.length > 10) {
      console.log(`   ... and ${statusPlaces.processing.length - 10} more\n`)
    }
  }

  // Check places pending
  if (statusPlaces.pending.length > 0) {
    console.log(`⏳ PLACES PENDING (${statusPlaces.pending.length} total)\n`)
  }

  // Summary
  const aiCompleted = stepCounts.ai_enhancement.completed
  const aiInProgress = stepCounts.ai_enhancement.in_progress
  const aiPending = stepCounts.ai_enhancement.pending
  const aiTotal = aiCompleted + aiInProgress + aiPending

  console.log('🤖 AI ENHANCEMENT SUMMARY')
  console.log('-'.repeat(70))
  console.log(`✅ Completed: ${aiCompleted}/${total} (${((aiCompleted / total) * 100).toFixed(1)}%)`)
  console.log(`🔄 In Progress: ${aiInProgress}/${total} (${((aiInProgress / total) * 100).toFixed(1)}%)`)
  console.log(`⏳ Pending: ${aiPending}/${total} (${((aiPending / total) * 100).toFixed(1)}%)`)
  console.log(`📊 Overall Progress: ${((aiCompleted / total) * 100).toFixed(1)}% complete`)
  console.log('')

  // Estimate time remaining
  if (aiInProgress > 0 || aiPending > 0) {
    const remaining = aiPending + aiInProgress
    const estimatedMinutes = remaining * 5 // ~5 minutes per place
    const estimatedHours = Math.ceil(estimatedMinutes / 60)
    console.log('⏱️  ESTIMATED TIME REMAINING')
    console.log('-'.repeat(70))
    console.log(`Places remaining: ${remaining}`)
    console.log(`Estimated time: ~${estimatedHours} hours (${estimatedMinutes} minutes)`)
    console.log('')
  }

  console.log('💡 Next Steps:')
  console.log('   - Monitor progress: /admin/fitness/queue')
  console.log('   - Check back later: node scripts/check-fitness-ai-progress.js')
  console.log('   - Once complete: node scripts/check-fitness-categories.js')
  console.log('')
}

checkProgress().catch(console.error)




























