/**
 * Check Fitness Extraction Status
 * Shows current status of all fitness place extractions
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

async function checkExtractionStatus() {
  console.log('\n📊 FITNESS EXTRACTION STATUS CHECK')
  console.log('='.repeat(70) + '\n')

  // Get all fitness places
  const { data: allPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, extraction_status, extraction_progress, description, bok_score, active, verified')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  const total = allPlaces?.length || 0
  const active = allPlaces?.filter(fp => fp.active).length || 0
  const verified = allPlaces?.filter(fp => fp.verified).length || 0

  console.log('📈 OVERALL STATISTICS')
  console.log('-'.repeat(70))
  console.log(`Total fitness places: ${total}`)
  console.log(`Active: ${active}`)
  console.log(`Verified: ${verified}\n`)

  // Group by extraction status
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
    failed: [],
    null: []
  }

  allPlaces?.forEach(fp => {
    const status = fp.extraction_status || 'null'
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++
      statusPlaces[status].push(fp)
    }
  })

  console.log('📋 EXTRACTION STATUS BREAKDOWN')
  console.log('-'.repeat(70))
  console.log(`✅ Completed: ${statusCounts.completed}`)
  console.log(`🔄 Processing: ${statusCounts.processing}`)
  console.log(`⏳ Pending: ${statusCounts.pending}`)
  console.log(`❌ Failed: ${statusCounts.failed}`)
  console.log(`❓ No Status: ${statusCounts.null}\n`)

  // Check completion rate
  const totalWithStatus = total - statusCounts.null
  const completedRate = totalWithStatus > 0 
    ? ((statusCounts.completed / totalWithStatus) * 100).toFixed(1)
    : 0

  console.log(`📊 Completion Rate: ${completedRate}% (${statusCounts.completed}/${totalWithStatus})\n`)

  // Show places that are processing
  if (statusPlaces.processing.length > 0) {
    console.log('🔄 PLACES CURRENTLY PROCESSING:')
    console.log('-'.repeat(70))
    statusPlaces.processing.slice(0, 10).forEach((fp, i) => {
      const progress = fp.extraction_progress || {}
      const currentStep = Object.keys(progress).find(step => 
        progress[step]?.status === 'in_progress'
      ) || 'unknown'
      console.log(`${i + 1}. ${fp.name}`)
      console.log(`   Step: ${currentStep}`)
      console.log(`   Has description: ${fp.description ? '✅' : '❌'}`)
      console.log(`   BOK Score: ${fp.bok_score || 'N/A'}`)
      console.log('')
    })
    if (statusPlaces.processing.length > 10) {
      console.log(`   ... and ${statusPlaces.processing.length - 10} more\n`)
    }
  }

  // Show places that are pending
  if (statusPlaces.pending.length > 0) {
    console.log('⏳ PLACES PENDING EXTRACTION:')
    console.log('-'.repeat(70))
    statusPlaces.pending.slice(0, 10).forEach((fp, i) => {
      console.log(`${i + 1}. ${fp.name}`)
      console.log(`   Has description: ${fp.description ? '✅' : '❌'}`)
      console.log('')
    })
    if (statusPlaces.pending.length > 10) {
      console.log(`   ... and ${statusPlaces.pending.length - 10} more\n`)
    }
  }

  // Show places that failed
  if (statusPlaces.failed.length > 0) {
    console.log('❌ PLACES WITH FAILED EXTRACTIONS:')
    console.log('-'.repeat(70))
    statusPlaces.failed.forEach((fp, i) => {
      console.log(`${i + 1}. ${fp.name}`)
      const progress = fp.extraction_progress || {}
      const failedStep = Object.keys(progress).find(step => 
        progress[step]?.status === 'failed'
      )
      if (failedStep) {
        console.log(`   Failed at: ${failedStep}`)
      }
      console.log('')
    })
  }

  // Check recently activated places (the 45 we just activated)
  const { data: recentlyActivated } = await supabase
    .from('fitness_places')
    .select('id, name, extraction_status, description, bok_score')
    .eq('active', true)
    .eq('verified', true)
    .order('updated_at', { ascending: false })
    .limit(50)

  const recentlyNeedingExtraction = recentlyActivated?.filter(fp => 
    !fp.description || fp.extraction_status !== 'completed'
  ) || []

  if (recentlyNeedingExtraction.length > 0) {
    console.log('\n📋 RECENTLY ACTIVATED PLACES STATUS:')
    console.log('-'.repeat(70))
    console.log(`Total recently activated: ${recentlyActivated?.length || 0}`)
    console.log(`Still need extraction: ${recentlyNeedingExtraction.length}`)
    console.log(`Extraction status:`)
    
    const recentStatusCounts = {
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0
    }
    
    recentlyActivated?.forEach(fp => {
      const status = fp.extraction_status || 'pending'
      if (recentStatusCounts[status] !== undefined) {
        recentStatusCounts[status]++
      }
    })
    
    console.log(`   ✅ Completed: ${recentStatusCounts.completed}`)
    console.log(`   🔄 Processing: ${recentStatusCounts.processing}`)
    console.log(`   ⏳ Pending: ${recentStatusCounts.pending}`)
    console.log(`   ❌ Failed: ${recentStatusCounts.failed}`)
  }

  console.log('\n💡 Next Steps:')
  if (statusPlaces.processing.length > 0) {
    console.log(`   - ${statusPlaces.processing.length} extractions are currently running`)
    console.log(`   - Check back in a few minutes to see progress`)
  }
  if (statusPlaces.pending.length > 0) {
    console.log(`   - ${statusPlaces.pending.length} extractions are queued and waiting to start`)
  }
  if (statusPlaces.failed.length > 0) {
    console.log(`   - ${statusPlaces.failed.length} extractions failed and may need to be retried`)
  }
  console.log('   - Monitor in admin panel: /admin/fitness/queue')
  console.log('')
}

checkExtractionStatus().catch(console.error)




























