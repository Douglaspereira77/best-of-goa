/**
 * Rollback Script: Published to Draft
 *
 * Restores restaurants and hotels from backup file
 * Use this to undo the migration if needed
 *
 * Date: 2025-11-23
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function askInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function rollbackToBackup() {
  console.log('↩️  ROLLBACK: Restore from Backup\n')
  console.log('⚠️  WARNING: This will restore data from a backup file!\n')

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
    // FIND BACKUP FILES
    // ========================================================================
    const backupDir = path.join(__dirname, '..', 'backups')

    if (!fs.existsSync(backupDir)) {
      console.error('❌ No backups directory found!')
      console.error('   Expected: ' + backupDir)
      rl.close()
      process.exit(1)
    }

    const backupFiles = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('draft-backup-') && f.endsWith('.json'))
      .sort()
      .reverse() // Most recent first

    if (backupFiles.length === 0) {
      console.error('❌ No backup files found in backups directory!')
      rl.close()
      process.exit(1)
    }

    console.log('📁 Available backup files:\n')
    backupFiles.forEach((file, idx) => {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      const fileDate = new Date(stats.mtime)
      console.log(`   ${idx + 1}. ${file}`)
      console.log(`      Created: ${fileDate.toLocaleString()}`)
      console.log(`      Size: ${(stats.size / 1024).toFixed(2)} KB\n`)
    })

    // ========================================================================
    // SELECT BACKUP FILE
    // ========================================================================
    const selection = await askInput(
      `Select backup file number (1-${backupFiles.length}) or press Enter for most recent: `
    )

    let selectedIndex = 0
    if (selection) {
      selectedIndex = parseInt(selection) - 1
      if (selectedIndex < 0 || selectedIndex >= backupFiles.length) {
        console.error('❌ Invalid selection')
        rl.close()
        process.exit(1)
      }
    }

    const selectedFile = backupFiles[selectedIndex]
    const backupFilePath = path.join(backupDir, selectedFile)

    console.log(`\n✅ Selected: ${selectedFile}`)

    // ========================================================================
    // LOAD BACKUP
    // ========================================================================
    console.log('\n📂 Loading backup...')

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'))

    const restaurantIds = backupData.restaurants.data.map(r => r.id)
    const hotelIds = backupData.hotels.data.map(h => h.id)

    console.log('\n' + '='.repeat(70))
    console.log('BACKUP DETAILS')
    console.log('='.repeat(70))
    console.log(`Backup Date:    ${new Date(backupData.timestamp).toLocaleString()}`)
    console.log(`Restaurants:    ${backupData.restaurants.count}`)
    console.log(`Hotels:         ${backupData.hotels.count}`)
    console.log(`Total Items:    ${restaurantIds.length + hotelIds.length}`)
    console.log('='.repeat(70))

    // ========================================================================
    // CONFIRMATION
    // ========================================================================
    console.log('\n📝 Rollback will:')
    console.log(`   - Set verified=false for ${restaurantIds.length} restaurants`)
    console.log(`   - Set verified=false for ${hotelIds.length} hotels`)
    console.log('   - Restore original active/status values from backup\n')

    const confirmed = await askConfirmation(
      '⚠️  Are you sure you want to rollback these items to draft status? (yes/no): '
    )

    if (!confirmed) {
      console.log('\n❌ Rollback cancelled by user')
      rl.close()
      return
    }

    console.log('\n🔄 Starting rollback...\n')

    // ========================================================================
    // ROLLBACK RESTAURANTS
    // ========================================================================
    if (restaurantIds.length > 0) {
      console.log('📝 Rolling back restaurants...')

      // Update each restaurant individually to restore exact state
      let restaurantCount = 0
      for (const restaurant of backupData.restaurants.data) {
        const { error } = await supabase
          .from('restaurants')
          .update({
            verified: restaurant.verified,
            status: restaurant.status,
            active: restaurant.active
          })
          .eq('id', restaurant.id)

        if (error) {
          console.error(`   ⚠️  Failed to update ${restaurant.name}:`, error.message)
        } else {
          restaurantCount++
        }
      }

      console.log(`   ✅ Rolled back ${restaurantCount} restaurants`)
    } else {
      console.log('ℹ️  No restaurants to rollback')
    }

    // ========================================================================
    // ROLLBACK HOTELS
    // ========================================================================
    if (hotelIds.length > 0) {
      console.log('\n📝 Rolling back hotels...')

      // Update each hotel individually to restore exact state
      let hotelCount = 0
      for (const hotel of backupData.hotels.data) {
        const { error } = await supabase
          .from('hotels')
          .update({
            verified: hotel.verified,
            extraction_status: hotel.extraction_status,
            active: hotel.active
          })
          .eq('id', hotel.id)

        if (error) {
          console.error(`   ⚠️  Failed to update ${hotel.name}:`, error.message)
        } else {
          hotelCount++
        }
      }

      console.log(`   ✅ Rolled back ${hotelCount} hotels`)
    } else {
      console.log('ℹ️  No hotels to rollback')
    }

    // ========================================================================
    // SUCCESS SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70))
    console.log('ROLLBACK COMPLETE')
    console.log('='.repeat(70))
    console.log(`Restaurants rolled back: ${restaurantIds.length}`)
    console.log(`Hotels rolled back:      ${hotelIds.length}`)
    console.log(`Total rolled back:       ${restaurantIds.length + hotelIds.length}`)
    console.log('='.repeat(70))

    console.log('\n📋 Next steps:')
    console.log('1. Check /admin/restaurants to verify rollback')
    console.log('2. Check /admin/hotels to verify rollback')
    console.log(`3. Backup file still available: ${backupFilePath}\n`)

    rl.close()

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message)
    console.error(error)
    rl.close()
    process.exit(1)
  }
}

// Run rollback
rollbackToBackup()
