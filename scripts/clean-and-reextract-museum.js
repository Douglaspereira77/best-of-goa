import { createClient } from '@supabase/supabase-js'
import { getAttractionImageExtractor } from '../src/lib/services/attraction-image-extractor.ts'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanAndReextractMuseum() {
  console.log('🧹 CLEAN & RE-EXTRACT: Museum of Modern Art')
  console.log('═'.repeat(80))
  console.log('')

  // Get Museum attraction
  const { data: attraction, error: attractionError } = await supabase
    .from('attractions')
    .select('id, name, slug')
    .eq('slug', 'museum-of-modern-art-sharq')
    .single()

  if (attractionError || !attraction) {
    console.error('❌ Attraction not found:', attractionError)
    process.exit(1)
  }

  console.log(`✅ Found: ${attraction.name}`)
  console.log(`   ID: ${attraction.id}`)
  console.log(`   Slug: ${attraction.slug}`)
  console.log('')

  // STEP 1: Delete database records
  console.log('━'.repeat(80))
  console.log('STEP 1: Deleting attraction_images records from database')
  console.log('━'.repeat(80))

  const { data: existingImages } = await supabase
    .from('attraction_images')
    .select('id')
    .eq('attraction_id', attraction.id)

  console.log(`   Found ${existingImages?.length || 0} existing image records`)

  const { error: deleteError } = await supabase
    .from('attraction_images')
    .delete()
    .eq('attraction_id', attraction.id)

  if (deleteError) {
    console.error('❌ Failed to delete database records:', deleteError)
    process.exit(1)
  }

  console.log('✅ Deleted all attraction_images records')
  console.log('')

  // STEP 2: Delete files from Supabase Storage
  console.log('━'.repeat(80))
  console.log('STEP 2: Deleting images from Supabase Storage')
  console.log('━'.repeat(80))

  const storagePath = `attractions/${attraction.slug}/images`

  // List files in storage
  const { data: files, error: listError } = await supabase.storage
    .from('attractions')
    .list(storagePath)

  if (listError) {
    console.warn('⚠️  Could not list storage files:', listError.message)
  } else if (files && files.length > 0) {
    console.log(`   Found ${files.length} files in storage`)

    // Delete all files
    const filePaths = files.map(f => `${storagePath}/${f.name}`)
    const { error: removeError } = await supabase.storage
      .from('attractions')
      .remove(filePaths)

    if (removeError) {
      console.warn('⚠️  Some files may not have been deleted:', removeError.message)
    } else {
      console.log('✅ Deleted all files from storage')
    }
  } else {
    console.log('   No files found in storage (already clean)')
  }
  console.log('')

  // STEP 3: Re-extract with Vision AI
  console.log('━'.repeat(80))
  console.log('STEP 3: Re-extracting images with Vision AI pipeline')
  console.log('━'.repeat(80))
  console.log('')

  const extractor = getAttractionImageExtractor()

  try {
    await extractor.extractAndUploadAttractionImages(attraction.id)
    console.log('')
    console.log('═'.repeat(80))
    console.log('✅ SUCCESS! Museum images re-extracted with Vision AI')
    console.log('═'.repeat(80))
    console.log('')
    console.log('📝 Next: Check the database to verify AI metadata')
    console.log('   Run: node scripts/show-museum-metadata.js')

  } catch (error) {
    console.error('')
    console.error('═'.repeat(80))
    console.error('❌ EXTRACTION FAILED')
    console.error('═'.repeat(80))
    console.error(error)
    process.exit(1)
  }
}

cleanAndReextractMuseum().catch(console.error)
