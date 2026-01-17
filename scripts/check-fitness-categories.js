/**
 * Check Fitness Categories in Database
 * Verifies if fitness_category_ids are populated and how they match fitness_types
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

async function checkFitnessCategories() {
  console.log('\n📊 FITNESS CATEGORIES VERIFICATION')
  console.log('='.repeat(70) + '\n')

  // Get all fitness categories from reference table
  const { data: allCategories } = await supabase
    .from('fitness_categories')
    .select('id, name, slug')
    .order('display_order')

  console.log('📋 AVAILABLE FITNESS CATEGORIES:')
  console.log('-'.repeat(70))
  allCategories?.forEach(cat => {
    console.log(`   ${cat.id}. ${cat.name} (${cat.slug})`)
  })
  console.log('')

  // Get all fitness places
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, fitness_types, fitness_category_ids, extraction_status')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  const total = fitnessPlaces?.length || 0

  // Analyze category population
  const withCategoryIds = fitnessPlaces?.filter(fp => 
    fp.fitness_category_ids && fp.fitness_category_ids.length > 0
  ) || []

  const withoutCategoryIds = fitnessPlaces?.filter(fp => 
    !fp.fitness_category_ids || fp.fitness_category_ids.length === 0
  ) || []

  const withFitnessTypes = fitnessPlaces?.filter(fp => 
    fp.fitness_types && fp.fitness_types.length > 0
  ) || []

  console.log('📈 CATEGORY POPULATION STATISTICS')
  console.log('-'.repeat(70))
  console.log(`Total active places: ${total}`)
  console.log(`With fitness_category_ids: ${withCategoryIds.length} (${((withCategoryIds.length / total) * 100).toFixed(1)}%)`)
  console.log(`Without fitness_category_ids: ${withoutCategoryIds.length} (${((withoutCategoryIds.length / total) * 100).toFixed(1)}%)`)
  console.log(`With fitness_types: ${withFitnessTypes.length} (${((withFitnessTypes.length / total) * 100).toFixed(1)}%)`)
  console.log('')

  // Check fitness_types distribution
  console.log('📊 FITNESS_TYPES DISTRIBUTION')
  console.log('-'.repeat(70))
  
  const typeCounts = {}
  fitnessPlaces?.forEach(fp => {
    const types = fp.fitness_types || []
    types.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
  })

  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1)
      console.log(`${type.padEnd(25)}: ${String(count).padStart(3)} places (${percentage}%)`)
    })
  console.log('')

  // Check category distribution
  console.log('📊 FITNESS_CATEGORY_IDS DISTRIBUTION')
  console.log('-'.repeat(70))
  
  const categoryCounts = {}
  fitnessPlaces?.forEach(fp => {
    const categoryIds = fp.fitness_category_ids || []
    categoryIds.forEach(id => {
      categoryCounts[id] = (categoryCounts[id] || 0) + 1
    })
  })

  allCategories?.forEach(cat => {
    const count = categoryCounts[cat.id] || 0
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
    console.log(`${cat.name.padEnd(25)}: ${String(count).padStart(3)} places (${percentage}%)`)
  })
  console.log('')

  // Show places without category IDs
  if (withoutCategoryIds.length > 0) {
    console.log('❌ PLACES WITHOUT fitness_category_ids (first 10):')
    console.log('-'.repeat(70))
    withoutCategoryIds.slice(0, 10).forEach((fp, i) => {
      const types = fp.fitness_types?.join(', ') || 'None'
      console.log(`${i + 1}. ${fp.name}`)
      console.log(`   fitness_types: [${types}]`)
      console.log(`   fitness_category_ids: ${fp.fitness_category_ids || '[]'}`)
      console.log('')
    })
    if (withoutCategoryIds.length > 10) {
      console.log(`   ... and ${withoutCategoryIds.length - 10} more\n`)
    }
  }

  // Show sample places with "gym" type
  const gymPlaces = fitnessPlaces?.filter(fp => 
    fp.fitness_types?.includes('gym')
  ) || []

  console.log('🏋️  SAMPLE PLACES WITH "gym" TYPE (first 15):')
  console.log('-'.repeat(70))
  gymPlaces.slice(0, 15).forEach((fp, i) => {
    const types = fp.fitness_types?.join(', ') || 'None'
    const categoryNames = (fp.fitness_category_ids || [])
      .map(id => allCategories?.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'None'
    console.log(`${i + 1}. ${fp.name}`)
    console.log(`   fitness_types: [${types}]`)
    console.log(`   categories: [${categoryNames}]`)
    console.log('')
  })

  console.log('\n💡 SUMMARY:')
  console.log(`   Total places: ${total}`)
  console.log(`   Places with "gym" type: ${gymPlaces.length} (${((gymPlaces.length / total) * 100).toFixed(1)}%)`)
  console.log(`   Places missing category_ids: ${withoutCategoryIds.length}`)
  console.log('')
}

checkFitnessCategories().catch(console.error)




























