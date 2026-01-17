require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testImport() {
  console.log('🏋️ Testing Fitness Data Import from Apify CSV\n');
  console.log('━'.repeat(60));

  const csvPath = 'C:\\Users\\Douglas\\Downloads\\Gym_data.csv';
  const gyms = [];

  // Read CSV
  console.log('📖 Reading CSV file...');

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Only take first 3 gyms for testing
        if (gyms.length < 3) {
          gyms.push(row);
        }
      })
      .on('end', async () => {
        console.log(`✅ Found ${gyms.length} gyms for testing\n`);

        for (let i = 0; i < gyms.length; i++) {
          const gym = gyms[i];
          console.log(`\n${'='.repeat(60)}`);
          console.log(`GYM ${i + 1}: ${gym.title}`);
          console.log('='.repeat(60));

          // Transform CSV row to Apify format
          const apifyData = {
            title: gym.title,
            address: gym.address,
            phone: gym.phone,
            phoneUnformatted: gym.phoneUnformatted,
            website: gym.website,
            description: gym.description,
            location: gym['location/lat'] && gym['location/lng'] ? {
              lat: parseFloat(gym['location/lat']),
              lng: parseFloat(gym['location/lng'])
            } : undefined,
            city: gym.city,
            neighborhood: gym.neighborhood,
            area: gym.area,
            categories: [gym['categories/0'], gym['categories/1'], gym['categories/2']].filter(Boolean),
            categoryName: gym.categoryName,
            totalScore: gym.totalScore ? parseFloat(gym.totalScore) : undefined,
            reviewsCount: gym.reviewsCount ? parseInt(gym.reviewsCount) : undefined,
            imageUrl: gym.imageUrl,
            imageUrls: [gym['imageUrls/0'], gym['imageUrls/1'], gym['imageUrls/2']].filter(Boolean),
            openingHours: parseOpeningHours(gym),
            additionalInfo: {
              Amenities: extractAdditionalInfo(gym, 'Amenities'),
              Parking: extractAdditionalInfo(gym, 'Parking'),
              Accessibility: extractAdditionalInfo(gym, 'Accessibility'),
              Offerings: extractAdditionalInfo(gym, 'Offerings'),
              Atmosphere: extractAdditionalInfo(gym, 'Atmosphere')
            },
            placesTags: parseTagsArray(gym, 'placesTags'),
            reviewsTags: parseTagsArray(gym, 'reviewsTags'),
            placeId: gym.placeId,
            googlePlaceId: gym.placeId
          };

          console.log('\n📊 Raw Apify Data:');
          console.log('  - Name:', apifyData.title);
          console.log('  - Address:', apifyData.address);
          console.log('  - Categories:', apifyData.categories.join(', '));
          console.log('  - Rating:', apifyData.totalScore);
          console.log('  - Reviews:', apifyData.reviewsCount);

          // Map using fitness-data-mapper
          console.log('\n🔄 Mapping data...');

          // Since we can't import TS directly in Node, we'll do the mapping inline
          const mapped = mapDataInline(apifyData);

          console.log('\n✅ Mapped Data:');
          console.log('  - Slug:', mapped.slug);
          console.log('  - Fitness Types:', JSON.stringify(mapped.fitness_types));
          console.log('  - Gender Policy:', mapped.gender_policy);
          console.log('  - Amenities:', JSON.stringify(mapped.amenities, null, 2));

          // Insert into database
          console.log('\n💾 Inserting into database...');

          const { data, error } = await supabase
            .from('fitness_places')
            .insert([mapped])
            .select('id, name, slug, fitness_types, gender_policy');

          if (error) {
            console.error('❌ Insert failed:', error.message);
            if (error.message.includes('duplicate')) {
              console.log('   (Gym already exists, skipping)');
            }
          } else {
            console.log('✅ Inserted successfully!');
            console.log('   ID:', data[0].id);
            console.log('   Slug:', data[0].slug);
          }
        }

        console.log('\n' + '━'.repeat(60));
        console.log('🎉 Test complete!');
        console.log('━'.repeat(60));

        // Show summary
        const { data: allFitness, error: countError } = await supabase
          .from('fitness_places')
          .select('id, name, fitness_types, gender_policy')
          .limit(10);

        if (!countError && allFitness) {
          console.log(`\n📊 Total fitness places in database: ${allFitness.length}`);
          allFitness.forEach((fp, i) => {
            console.log(`   ${i + 1}. ${fp.name} (${fp.fitness_types?.join(', ')}) - ${fp.gender_policy}`);
          });
        }

        resolve();
      })
      .on('error', reject);
  });
}

// Helper: Parse opening hours from CSV
function parseOpeningHours(gym) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = [];

  for (let i = 0; i < 7; i++) {
    const day = gym[`openingHours/${i}/day`];
    const hoursStr = gym[`openingHours/${i}/hours`];
    if (day && hoursStr) {
      hours.push({ day, hours: hoursStr });
    }
  }

  return hours;
}

// Helper: Extract additional info fields
function extractAdditionalInfo(gym, category) {
  const fields = [];
  for (let i = 0; i < 5; i++) {
    const keys = Object.keys(gym).filter(k => k.startsWith(`additionalInfo/${category}/${i}/`));
    keys.forEach(key => {
      const value = gym[key];
      if (value === 'true' || value) {
        const fieldName = key.split('/').pop();
        fields.push(fieldName);
      }
    });
  }
  return fields.join(', ');
}

// Helper: Parse tags arrays
function parseTagsArray(gym, tagType) {
  const tags = [];
  for (let i = 0; i < 10; i++) {
    const title = gym[`${tagType}/${i}/title`];
    const count = gym[`${tagType}/${i}/count`];
    if (title) {
      tags.push({ title, count: count ? parseInt(count) : 0 });
    }
  }
  return tags;
}

// Inline mapping (simplified version of fitness-data-mapper.ts logic)
function mapDataInline(apifyData) {
  const name = apifyData.title || '';
  const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  // Detect gender policy
  let gender_policy = 'co-ed';
  const nameAndDesc = `${name} ${apifyData.description || ''}`.toLowerCase();
  if (nameAndDesc.includes('women only') || nameAndDesc.includes('ladies only') || nameAndDesc.includes('female')) {
    gender_policy = 'women-only';
  } else if (nameAndDesc.includes('men only') || nameAndDesc.includes('gents only')) {
    gender_policy = 'men-only';
  }

  // Categorize fitness type
  const allText = [name, ...(apifyData.categories || []), apifyData.categoryName || ''].join(' ').toLowerCase();
  const fitness_types = [];
  if (allText.includes('gym') || allText.includes('fitness')) fitness_types.push('gym');
  if (allText.includes('yoga')) fitness_types.push('yoga');
  if (allText.includes('crossfit')) fitness_types.push('crossfit');
  if (fitness_types.length === 0) fitness_types.push('gym');

  // Parse amenities
  const amenitiesText = (apifyData.additionalInfo?.Amenities || '').toLowerCase();
  const parkingText = (apifyData.additionalInfo?.Parking || '').toLowerCase();
  const offeringsText = (apifyData.additionalInfo?.Offerings || '').toLowerCase();
  const atmosphereText = (apifyData.additionalInfo?.Atmosphere || '').toLowerCase();

  const amenities = {
    pool: amenitiesText.includes('swimming pool') || amenitiesText.includes('pool'),
    sauna: offeringsText.includes('sauna') || amenitiesText.includes('sauna'),
    steam_room: amenitiesText.includes('steam room'),
    parking: parkingText.includes('free') ? 'free' : (parkingText.includes('paid') ? 'paid' : 'none'),
    childcare: amenitiesText.includes('child care'),
    wifi: amenitiesText.includes('wi-fi') || amenitiesText.includes('wifi'),
    showers: atmosphereText.includes('shower') || true,
    lockers: true,
    wheelchair_accessible: (apifyData.additionalInfo?.Accessibility || '').toLowerCase().includes('wheelchair')
  };

  return {
    name,
    slug,
    description: apifyData.description || null,
    address: apifyData.address || '',
    area: apifyData.neighborhood || apifyData.area || '',
    country_code: 'KW',
    latitude: apifyData.location?.lat || null,
    longitude: apifyData.location?.lng || null,
    phone: apifyData.phoneUnformatted || apifyData.phone || null,
    website: apifyData.website || null,
    google_rating: apifyData.totalScore || null,
    google_review_count: apifyData.reviewsCount || 0,
    fitness_types,
    amenities,
    gender_policy,
    hero_image: apifyData.imageUrls?.[0] || apifyData.imageUrl || null,
    apify_output: apifyData,
    google_place_id: apifyData.placeId || apifyData.googlePlaceId || null,
    extraction_status: 'completed',
    extraction_source: 'csv_test',
    active: true
  };
}

testImport()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });