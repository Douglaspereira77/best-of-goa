require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkPhotos() {
  const { data: gyms, error } = await supabase
    .from('fitness_places')
    .select('id, name, apify_output')
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('📸 Photo availability in Apify data:\n')

  gyms.forEach((gym, i) => {
    const apify = gym.apify_output || {}
    const imageUrl = apify.imageUrl
    const imageUrls = apify.imageUrls || []
    const imagesCount = apify.imagesCount || 0

    console.log(`${i + 1}. ${gym.name}`)
    console.log(`   Images count: ${imagesCount}`)
    console.log(`   Main image: ${imageUrl ? '✅' : '❌'}`)
    console.log(`   Gallery URLs: ${imageUrls.length} photos`)

    if (imageUrls.length > 0) {
      console.log(`   Sample URL: ${imageUrls[0]?.substring(0, 80)}...`)
    }
    console.log('')
  })

  // Summary
  const withImages = gyms.filter(g => g.apify_output?.imageUrl).length
  console.log(`\n📊 Summary: ${withImages}/${gyms.length} gyms have photo data available`)
}

checkPhotos()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })