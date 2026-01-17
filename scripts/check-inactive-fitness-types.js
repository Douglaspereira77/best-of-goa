/**
 * Check inactive fitness places for missing types
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

async function checkInactivePlaces() {
  console.log('\n🔍 Checking Inactive Fitness Places for Missing Types\n')
  console.log('='.repeat(70))

  // Get all inactive places
  const { data: inactivePlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, fitness_types, active, extraction_status, description, google_review_count')
    .eq('active', false)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`\nTotal inactive places: ${inactivePlaces?.length || 0}\n`)

  // Check for missing types in inactive places
  const missingTypePlaces = inactivePlaces?.filter(fp => {
    if (!fp.fitness_types || fp.fitness_types.length === 0) return false
    return fp.fitness_types.some(type => MISSING_TYPES.includes(type))
  }) || []

  console.log(`Places with missing types (inactive): ${missingTypePlaces.length}\n`)

  if (missingTypePlaces.length > 0) {
    console.log('📋 INACTIVE PLACES WITH MISSING TYPES:')
    console.log('-'.repeat(70))
    
    missingTypePlaces.forEach((fp, i) => {
      const types = fp.fitness_types?.join(', ') || 'Unknown'
      const reviews = fp.google_review_count || 0
      const hasDesc = fp.description ? '✅' : '❌'
      console.log(`${i + 1}. ${fp.name}`)
      console.log(`   Types: ${types}`)
      console.log(`   Reviews: ${reviews}`)
      console.log(`   Extracted: ${hasDesc}`)
      console.log(`   Slug: ${fp.slug}`)
      console.log('')
    })

    // Group by type
    console.log('\n📊 BREAKDOWN BY TYPE:')
    console.log('-'.repeat(70))
    
    MISSING_TYPES.forEach(type => {
      const places = missingTypePlaces.filter(fp => 
        fp.fitness_types?.includes(type)
      )
      if (places.length > 0) {
        const name = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
        console.log(`${name}: ${places.length} places`)
      }
    })

    console.log(`\n\n💡 RECOMMENDATION:`)
    console.log(`   Found ${missingTypePlaces.length} inactive places with missing types.`)
    console.log(`   You can:`)
    console.log(`   1. Activate these places (set active = true)`)
    console.log(`   2. Extract them if they don't have descriptions`)
    console.log(`   3. Or search for new places if these aren't enough`)
  } else {
    console.log('❌ No inactive places found with missing types (Boxing, Cycling, Swimming, Personal Training)')
    console.log('\n💡 Next steps:')
    console.log('   You may need to search for and add new fitness places for these types')
    console.log('   Use the admin panel: /admin/fitness/add')
    console.log('   Or use Google Places API to find places')
  }
}

checkInactivePlaces().catch(console.error)




























