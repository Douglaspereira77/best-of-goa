/**
 * Analyze Fitness Places Database
 * Plan extraction strategy for remaining fitness places beyond top 50
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

// All fitness types we want to check
const ALL_FITNESS_TYPES = [
  'gym',
  'yoga',
  'pilates',
  'crossfit',
  'martial-arts',
  'boxing',
  'dance',
  'cycling',
  'swimming',
  'personal-training'
]

async function analyzeFitnessPlaces() {
  console.log('\n📊 FITNESS PLACES EXTRACTION ANALYSIS')
  console.log('='.repeat(70) + '\n')

  // 1. Total count
  const { count: totalCount } = await supabase
    .from('fitness_places')
    .select('*', { count: 'exact', head: true })

  console.log('📈 OVERALL STATISTICS')
  console.log('-'.repeat(70))
  console.log(`Total fitness places in database: ${totalCount || 0}\n`)

  // 2. Active vs Inactive
  const { count: activeCount } = await supabase
    .from('fitness_places')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  const { count: inactiveCount } = await supabase
    .from('fitness_places')
    .select('*', { count: 'exact', head: true })
    .eq('active', false)

  console.log(`Active: ${activeCount || 0}`)
  console.log(`Inactive: ${inactiveCount || 0}\n`)

  // 3. Extraction status breakdown
  const { data: statusData } = await supabase
    .from('fitness_places')
    .select('extraction_status, active')
    .eq('active', true)

  const statusCounts = {
    completed: 0,
    processing: 0,
    pending: 0,
    failed: null,
    null: 0
  }

  statusData?.forEach(fp => {
    const status = fp.extraction_status || 'null'
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++
    }
  })

  console.log('📋 EXTRACTION STATUS (Active Places Only)')
  console.log('-'.repeat(70))
  console.log(`Completed: ${statusCounts.completed}`)
  console.log(`Processing: ${statusCounts.processing}`)
  console.log(`Pending: ${statusCounts.pending}`)
  console.log(`No Status: ${statusCounts.null}\n`)

  // 4. Top 50 vs Rest
  const { data: top50 } = await supabase
    .from('fitness_places')
    .select('id, name, extraction_status, description, fitness_types')
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .eq('active', true)
    .order('google_review_count', { ascending: false })
    .limit(50)

  const { data: rest } = await supabase
    .from('fitness_places')
    .select('id, name, extraction_status, description, fitness_types, google_review_count')
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .eq('active', true)
    .order('google_review_count', { ascending: false })
    .range(50, 999) // Get places 51+

  console.log('🏆 TOP 50 vs REMAINING')
  console.log('-'.repeat(70))
  console.log(`Top 50 (by review count): ${top50?.length || 0}`)
  console.log(`Remaining places: ${rest?.length || 0}`)
  
  const top50Extracted = top50?.filter(fp => fp.description).length || 0
  const restExtracted = rest?.filter(fp => fp.description).length || 0
  
  console.log(`\nTop 50 extracted: ${top50Extracted}/${top50?.length || 0}`)
  console.log(`Remaining extracted: ${restExtracted}/${rest?.length || 0}\n`)

  // 5. Fitness type distribution
  console.log('🏋️  FITNESS TYPE DISTRIBUTION')
  console.log('-'.repeat(70))
  
  const typeAnalysis = await Promise.all(
    ALL_FITNESS_TYPES.map(async (type) => {
      // Total count (all places)
      const { count: total } = await supabase
        .from('fitness_places')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .contains('fitness_types', [type])

      // Count in top 50
      const top50WithType = top50?.filter(fp => 
        fp.fitness_types?.includes(type)
      ).length || 0

      // Count in remaining
      const restWithType = rest?.filter(fp => 
        fp.fitness_types?.includes(type)
      ).length || 0

      // Extracted count
      const { count: extracted } = await supabase
        .from('fitness_places')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .contains('fitness_types', [type])
        .not('description', 'is', null)

      return {
        type,
        total: total || 0,
        top50: top50WithType,
        remaining: restWithType,
        extracted: extracted || 0,
        needsExtraction: (total || 0) - (extracted || 0)
      }
    })
  )

  // Display type breakdown
  typeAnalysis.forEach(({ type, total, top50, remaining, extracted, needsExtraction }) => {
    const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
    const status = total > 0 ? (extracted === total ? '✅' : '⚠️ ') : '❌'
    console.log(`${status} ${name.padEnd(20)} | Total: ${String(total).padStart(3)} | Top50: ${String(top50).padStart(2)} | Rest: ${String(remaining).padStart(3)} | Extracted: ${String(extracted).padStart(3)} | Need: ${String(needsExtraction).padStart(3)}`)
  })

  // 6. Places needing extraction
  const allNeedingExtraction = rest?.filter(fp => !fp.description) || []
  const totalNeedsExtraction = allNeedingExtraction.length

  console.log(`\n\n📋 EXTRACTION SUMMARY`)
  console.log('='.repeat(70))
  console.log(`Total places needing extraction: ${totalNeedsExtraction}`)
  console.log(`Estimated cost: ~$${(totalNeedsExtraction * 0.22).toFixed(2)}`)
  console.log(`Estimated time: ~${Math.ceil(totalNeedsExtraction * 5 / 60)} minutes`)

  // 7. Sample places
  if (allNeedingExtraction.length > 0) {
    console.log(`\n\n📝 SAMPLE PLACES NEEDING EXTRACTION (first 10):`)
    console.log('-'.repeat(70))
    allNeedingExtraction.slice(0, 10).forEach((fp, i) => {
      const types = fp.fitness_types?.join(', ') || 'Unknown'
      const reviews = fp.google_review_count || 0
      console.log(`${i + 1}. ${fp.name} (${types}) - ${reviews} reviews`)
    })
  }

  return {
    totalNeedsExtraction,
    placesNeedingExtraction: allNeedingExtraction
  }
}

analyzeFitnessPlaces()
  .then((result) => {
    if (result) {
      console.log(`\n\n✅ Analysis complete!`)
      console.log(`   Ready to extract ${result.totalNeedsExtraction} places`)
    }
  })
  .catch(console.error)




























