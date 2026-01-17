/**
 * Backup Script: Draft Restaurants & Hotels
 *
 * Creates a JSON backup of all draft restaurants and hotels
 * before marking them as published (verified=true)
 *
 * Date: 2025-11-23
 * Purpose: Safety backup before bulk status update
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function createBackup() {
  console.log('🔄 Starting backup process...\n')

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
    // BACKUP DRAFT RESTAURANTS
    // ========================================================================
    console.log('📊 Fetching draft restaurants...')
    console.log('   Criteria: status=\'active\' AND verified=false\n')

    const { data: draftRestaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('status', 'active')
      .eq('verified', false)

    if (restaurantsError) {
      throw new Error(`Failed to fetch restaurants: ${restaurantsError.message}`)
    }

    console.log(`   ✅ Found ${draftRestaurants.length} draft restaurants`)

    // ========================================================================
    // BACKUP DRAFT HOTELS
    // ========================================================================
    console.log('\n📊 Fetching draft hotels...')
    console.log('   Criteria: extraction_status=\'completed\' AND verified=false\n')

    const { data: draftHotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .eq('extraction_status', 'completed')
      .eq('verified', false)

    if (hotelsError) {
      throw new Error(`Failed to fetch hotels: ${hotelsError.message}`)
    }

    console.log(`   ✅ Found ${draftHotels.length} draft hotels`)

    // ========================================================================
    // CREATE BACKUP FILE
    // ========================================================================
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(__dirname, '..', 'backups')

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupFilePath = path.join(backupDir, `draft-backup-${timestamp}.json`)

    const backupData = {
      timestamp: new Date().toISOString(),
      purpose: 'Backup before marking draft items as published',
      restaurants: {
        count: draftRestaurants.length,
        criteria: 'status=active AND verified=false',
        data: draftRestaurants
      },
      hotels: {
        count: draftHotels.length,
        criteria: 'extraction_status=completed AND verified=false',
        data: draftHotels
      }
    }

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2))

    console.log('\n✅ BACKUP CREATED SUCCESSFULLY!')
    console.log(`   File: ${backupFilePath}`)
    console.log(`   Size: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`)

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70))
    console.log('BACKUP SUMMARY')
    console.log('='.repeat(70))
    console.log(`Draft Restaurants: ${draftRestaurants.length}`)
    console.log(`Draft Hotels:      ${draftHotels.length}`)
    console.log(`Total Items:       ${draftRestaurants.length + draftHotels.length}`)
    console.log('='.repeat(70))

    if (draftRestaurants.length > 0) {
      console.log('\n📝 Sample Draft Restaurants:')
      draftRestaurants.slice(0, 5).forEach(r => {
        console.log(`   - ${r.name} (${r.slug})`)
      })
    }

    if (draftHotels.length > 0) {
      console.log('\n📝 Sample Draft Hotels:')
      draftHotels.slice(0, 5).forEach(h => {
        console.log(`   - ${h.name} (${h.slug})`)
      })
    }

    console.log('\n✅ Backup complete! Safe to proceed with migration.')
    console.log(`   Backup file: ${backupFilePath}\n`)

  } catch (error) {
    console.error('\n❌ Backup failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run backup
createBackup()
