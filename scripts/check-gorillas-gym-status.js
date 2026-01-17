/**
 * Check Gorillas Gym Goa status and trigger re-extraction if needed
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

async function checkGorillasGym() {
  const slug = 'gorillas-gym-goa-salmiya'
  
  console.log(`\nðŸ” Checking status for: ${slug}\n`)

  // Get the fitness place
  const { data: fitnessPlace, error } = await supabase
    .from('fitness_places')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !fitnessPlace) {
    console.error('âŒ Error fetching fitness place:', error)
    return
  }

  console.log('ðŸ“Š Fitness Place Data:')
  console.log(`   ID: ${fitnessPlace.id}`)
  console.log(`   Name: ${fitnessPlace.name}`)
  console.log(`   Active: ${fitnessPlace.active}`)
  console.log(`   Verified: ${fitnessPlace.verified}`)
  console.log(`   Extraction Status: ${fitnessPlace.extraction_status}`)
  console.log(`   Has Description: ${!!fitnessPlace.description}`)
  console.log(`   Has Short Description: ${!!fitnessPlace.short_description}`)
  console.log(`   BOK Score: ${fitnessPlace.bok_score || 'N/A'}`)

  // Check images
  const { count: imageCount } = await supabase
    .from('fitness_images')
    .select('*', { count: 'exact', head: true })
    .eq('fitness_place_id', fitnessPlace.id)

  console.log(`   Image Count: ${imageCount || 0}`)

  // Check FAQs
  const { count: faqCount } = await supabase
    .from('fitness_faqs')
    .select('*', { count: 'exact', head: true })
    .eq('fitness_place_id', fitnessPlace.id)

  console.log(`   FAQ Count: ${faqCount || 0}`)

  // Check if re-extraction is needed
  const needsExtraction = 
    !fitnessPlace.description ||
    imageCount === 0 ||
    faqCount === 0 ||
    fitnessPlace.extraction_status !== 'completed'

  if (needsExtraction) {
    console.log('\nâš ï¸  Missing content detected. Triggering re-extraction...\n')
    
    // Reset extraction status
    const { error: updateError } = await supabase
      .from('fitness_places')
      .update({
        extraction_status: 'pending',
        extraction_progress: null
      })
      .eq('id', fitnessPlace.id)

    if (updateError) {
      console.error('âŒ Error resetting extraction status:', updateError)
      return
    }

    console.log('âœ… Extraction status reset to pending')
    console.log('\nðŸ“¡ Triggering re-extraction via API...\n')

    // Trigger re-extraction via API
    const apiUrl = `http://localhost:3000/api/admin/fitness/${fitnessPlace.id}/rerun`
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('âœ… Re-extraction triggered successfully!')
        console.log('â³ Extraction will run in the background.')
        console.log('   Check the admin panel to monitor progress.')
      } else {
        const errorText = await response.text()
        console.error('âŒ Error triggering re-extraction:', response.status, errorText)
      }
    } catch (error) {
      console.error('âŒ Error calling API:', error.message)
      console.log('\nðŸ’¡ You can manually trigger re-extraction via:')
      console.log(`   POST http://localhost:3000/api/admin/fitness/${fitnessPlace.id}/rerun`)
    }
  } else {
    console.log('\nâœ… All content appears to be present!')
    console.log('   If content is still not showing, check:')
    console.log('   - Server logs for errors')
    console.log('   - Database field values')
    console.log('   - Component rendering logic')
  }
}

checkGorillasGym().catch(console.error)




























