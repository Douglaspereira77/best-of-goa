/**
 * Preview Script: Draft to Published Migration
 *
 * Shows exactly what will be changed when marking drafts as published
 * Does NOT make any changes - read-only preview
 *
 * Date: 2025-11-23
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function previewMigration() {
  console.log('🔍 PREVIEW: Draft to Published Migration\n')
  console.log('This script will NOT make any changes - it only shows what would happen.\n')

  // Initialize Supabase
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // ========================================================================
    // PREVIEW RESTAURANTS
    // ========================================================================
    console.log('=' .repeat(70))
    console.log('RESTAURANTS MIGRATION PREVIEW')
    console.log('='.repeat(70))

    const { data: draftRestaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, slug, status, verified, active, area, google_rating')
      .eq('status', 'active')
      .eq('verified', false)

    if (restaurantsError) {
      throw new Error(`Failed to fetch restaurants: ${restaurantsError.message}`)
    }

    console.log(`\n📊 Found ${draftRestaurants.length} draft restaurants`)
    console.log(`\nCurrent State:`)
    console.log(`   - status: 'active'`)
    console.log(`   - verified: false`)
    console.log(`\nAfter Migration:`)
    console.log(`   - status: 'active' (unchanged)`)
    console.log(`   - verified: true ✨ (CHANGED)`)

    if (draftRestaurants.length > 0) {
      console.log(`\n📝 Restaurants that will be marked as published:\n`)
      draftRestaurants.forEach((r, idx) => {
        console.log(`   ${idx + 1}. ${r.name}`)
        console.log(`      Slug: ${r.slug}`)
        console.log(`      Area: ${r.area || 'Unknown'}`)
        console.log(`      Rating: ${r.google_rating || 'N/A'}`)
        console.log(`      Current: verified=false → Will become: verified=true`)
        console.log('')
      })
    } else {
      console.log('\n   ℹ️  No draft restaurants found (nothing to update)')
    }

    // ========================================================================
    // PREVIEW HOTELS
    // ========================================================================
    console.log('='.repeat(70))
    console.log('HOTELS MIGRATION PREVIEW')
    console.log('='.repeat(70))

    const { data: draftHotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, name, slug, extraction_status, verified, active, area, google_rating')
      .eq('extraction_status', 'completed')
      .eq('verified', false)

    if (hotelsError) {
      throw new Error(`Failed to fetch hotels: ${hotelsError.message}`)
    }

    console.log(`\n📊 Found ${draftHotels.length} draft hotels`)
    console.log(`\nCurrent State:`)
    console.log(`   - extraction_status: 'completed'`)
    console.log(`   - verified: false`)
    console.log(`   - active: [varies]`)
    console.log(`\nAfter Migration:`)
    console.log(`   - extraction_status: 'completed' (unchanged)`)
    console.log(`   - verified: true ✨ (CHANGED)`)
    console.log(`   - active: true ✨ (CHANGED - set to true for all)`)

    if (draftHotels.length > 0) {
      console.log(`\n📝 Hotels that will be marked as published:\n`)
      draftHotels.forEach((h, idx) => {
        console.log(`   ${idx + 1}. ${h.name}`)
        console.log(`      Slug: ${h.slug}`)
        console.log(`      Area: ${h.area || 'Unknown'}`)
        console.log(`      Rating: ${h.google_rating || 'N/A'}`)
        console.log(`      Current: verified=false, active=${h.active}`)
        console.log(`      Will become: verified=true, active=true`)
        console.log('')
      })
    } else {
      console.log('\n   ℹ️  No draft hotels found (nothing to update)')
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(70))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`\nTotal items to be updated: ${draftRestaurants.length + draftHotels.length}`)
    console.log(`   - Restaurants: ${draftRestaurants.length}`)
    console.log(`   - Hotels: ${draftHotels.length}`)

    console.log(`\n🔄 SQL Queries that will be executed:`)
    console.log(`\n   Restaurants:`)
    console.log(`   UPDATE restaurants`)
    console.log(`   SET verified = true`)
    console.log(`   WHERE status = 'active' AND verified = false`)
    console.log(`   → Affects ${draftRestaurants.length} rows`)

    console.log(`\n   Hotels:`)
    console.log(`   UPDATE hotels`)
    console.log(`   SET verified = true, active = true`)
    console.log(`   WHERE extraction_status = 'completed' AND verified = false`)
    console.log(`   → Affects ${draftHotels.length} rows`)

    console.log('\n='.repeat(70))
    console.log('✅ Preview complete - no changes made')
    console.log('='.repeat(70))
    console.log('\nNext steps:')
    console.log('1. Run: node bin/backup-draft-status.js (create backup)')
    console.log('2. Run: node bin/migrate-draft-to-published.js (execute migration)')
    console.log('3. If needed: node bin/rollback-published-to-draft.js (undo changes)\n')

  } catch (error) {
    console.error('\n❌ Preview failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run preview
previewMigration()
