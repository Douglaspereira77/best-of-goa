/**
 * Migration Script: Draft to Published
 *
 * Marks all draft restaurants and hotels as published
 *
 * IMPORTANT: Run backup-draft-status.js BEFORE running this script!
 *
 * Date: 2025-11-23
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function migrateDraftToPublished() {
  console.log('🚀 MIGRATION: Draft to Published\n')
  console.log('⚠️  WARNING: This will update database records!\n')

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
    // CHECK WHAT WILL BE UPDATED
    // ========================================================================
    console.log('🔍 Checking current draft status...\n')

    const { data: draftRestaurants } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('status', 'active')
      .eq('verified', false)

    const { data: draftHotels } = await supabase
      .from('hotels')
      .select('id, name')
      .eq('extraction_status', 'completed')
      .eq('verified', false)

    const restaurantCount = draftRestaurants?.length || 0
    const hotelCount = draftHotels?.length || 0
    const totalCount = restaurantCount + hotelCount

    if (totalCount === 0) {
      console.log('ℹ️  No draft items found - nothing to update!')
      rl.close()
      return
    }

    console.log('=' .repeat(70))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`Draft Restaurants: ${restaurantCount}`)
    console.log(`Draft Hotels:      ${hotelCount}`)
    console.log(`Total Items:       ${totalCount}`)
    console.log('='.repeat(70))

    console.log('\n📝 Changes to be made:')
    console.log('   Restaurants: Set verified=true')
    console.log('   Hotels: Set verified=true AND active=true\n')

    // ========================================================================
    // CONFIRMATION
    // ========================================================================
    const confirmed = await askConfirmation(
      `\n⚠️  Are you sure you want to mark ${totalCount} items as published? (yes/no): `
    )

    if (!confirmed) {
      console.log('\n❌ Migration cancelled by user')
      rl.close()
      return
    }

    console.log('\n🔄 Starting migration...\n')

    // ========================================================================
    // UPDATE RESTAURANTS
    // ========================================================================
    if (restaurantCount > 0) {
      console.log('📝 Updating restaurants...')

      const { data: updatedRestaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .update({ verified: true })
        .eq('status', 'active')
        .eq('verified', false)
        .select('id, name')

      if (restaurantsError) {
        throw new Error(`Failed to update restaurants: ${restaurantsError.message}`)
      }

      console.log(`   ✅ Updated ${updatedRestaurants.length} restaurants`)
    } else {
      console.log('ℹ️  No draft restaurants to update')
    }

    // ========================================================================
    // UPDATE HOTELS
    // ========================================================================
    if (hotelCount > 0) {
      console.log('\n📝 Updating hotels...')

      const { data: updatedHotels, error: hotelsError } = await supabase
        .from('hotels')
        .update({
          verified: true,
          active: true
        })
        .eq('extraction_status', 'completed')
        .eq('verified', false)
        .select('id, name')

      if (hotelsError) {
        throw new Error(`Failed to update hotels: ${hotelsError.message}`)
      }

      console.log(`   ✅ Updated ${updatedHotels.length} hotels`)
    } else {
      console.log('ℹ️  No draft hotels to update')
    }

    // ========================================================================
    // VERIFICATION
    // ========================================================================
    console.log('\n🔍 Verifying migration...\n')

    // Check for any remaining drafts
    const { data: remainingDraftRestaurants } = await supabase
      .from('restaurants')
      .select('id')
      .eq('status', 'active')
      .eq('verified', false)

    const { data: remainingDraftHotels } = await supabase
      .from('hotels')
      .select('id')
      .eq('extraction_status', 'completed')
      .eq('verified', false)

    const remainingDrafts =
      (remainingDraftRestaurants?.length || 0) +
      (remainingDraftHotels?.length || 0)

    if (remainingDrafts === 0) {
      console.log('✅ MIGRATION SUCCESSFUL!')
      console.log('   All draft items have been marked as published.')
    } else {
      console.log(`⚠️  Warning: ${remainingDrafts} draft items still remain`)
      console.log('   Please check manually for any issues.')
    }

    // ========================================================================
    // SUCCESS SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70))
    console.log('MIGRATION COMPLETE')
    console.log('='.repeat(70))
    console.log(`Restaurants updated: ${restaurantCount}`)
    console.log(`Hotels updated:      ${hotelCount}`)
    console.log(`Total updated:       ${totalCount}`)
    console.log('='.repeat(70))

    console.log('\n📋 Next steps:')
    console.log('1. Check /admin/restaurants to verify changes')
    console.log('2. Check /admin/hotels to verify changes')
    console.log('3. If needed, run rollback: node bin/rollback-published-to-draft.js')
    console.log('4. Backup file is in: backups/ directory\n')

    rl.close()

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    rl.close()
    process.exit(1)
  }
}

// Run migration
migrateDraftToPublished()
