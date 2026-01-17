/**
 * Re-run Category Matching for All Fitness Places
 * 
 * This script:
 * 1. Re-runs the category matching step for all active fitness places
 * 2. Uses the updated fitness_types (from AI suggestions if available)
 * 3. Updates fitness_category_ids accordingly
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

async function rerunCategoryMatching() {
  console.log('\n🔄 RE-RUNNING FITNESS CATEGORY MATCHING')
  console.log('='.repeat(70) + '\n')

  // Get all active fitness places
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, fitness_types')
    .eq('active', true)

  if (error) {
    console.error('❌ Error fetching fitness places:', error)
    process.exit(1)
  }

  console.log(`Found ${fitnessPlaces?.length || 0} active fitness places\n`)

  // Fetch all categories
  const { data: categories } = await supabase
    .from('fitness_categories')
    .select('id, slug')

  if (!categories) {
    console.error('❌ Error fetching categories')
    process.exit(1)
  }

  console.log(`Available categories: ${categories.length}\n`)

  let updated = 0
  let skipped = 0
  const errors = []

  // Process each place
  for (const fp of fitnessPlaces || []) {
    try {
      const types = fp.fitness_types || []
      
      if (types.length === 0) {
        console.log(`⏭️  SKIPPED: ${fp.name} (no fitness_types)`)
        skipped++
        continue
      }

      // Match fitness types to category IDs
      const categoryIds = []
      for (const type of types) {
        const match = categories.find(c => c.slug === type)
        if (match) {
          categoryIds.push(match.id)
        } else {
          console.log(`⚠️  No category found for type: ${type} (${fp.name})`)
        }
      }

      if (categoryIds.length === 0) {
        console.log(`⚠️  No category IDs matched for: ${fp.name} (types: ${types.join(', ')})`)
        skipped++
        continue
      }

      // Update fitness place
      const { error: updateError } = await supabase
        .from('fitness_places')
        .update({ fitness_category_ids: categoryIds })
        .eq('id', fp.id)

      if (updateError) {
        throw updateError
      }

      const categoryNames = categoryIds
        .map(id => categories.find(c => c.id === id)?.slug)
        .filter(Boolean)
        .join(', ')

      console.log(`✅ ${fp.name}`)
      console.log(`   Types: [${types.join(', ')}] → Categories: [${categoryNames}]`)
      updated++

    } catch (error) {
      console.error(`❌ Error updating ${fp.name}:`, error)
      errors.push({ name: fp.name, error: error.message })
    }
  }

  console.log('\n\n' + '='.repeat(70))
  console.log('📊 SUMMARY')
  console.log('='.repeat(70))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:')
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.name}: ${err.error}`)
    })
  }

  console.log('')
}

rerunCategoryMatching().catch(console.error)

