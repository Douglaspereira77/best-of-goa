#!/usr/bin/env node

/**
 * GOA HOTEL DISCOVERY SCRIPT
 *
 * Discovers all hotels in Goa using Google Places Nearby Search API
 * Strategy: Search by geographic zones with radius to ensure complete coverage
 *
 * Output: discovered-hotels.json with all hotels found
 * Filters: Active hotels with 10+ reviews
 *
 * Usage: node bin/discover-goa-hotels.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Goa geographic zones for comprehensive coverage
const GOA_ZONES = [
  // Capital & Business Districts
  { name: 'Goa City', lat: 29.3759, lng: 47.9774, radius: 5000, priority: 1 },
  { name: 'Salmiya', lat: 29.3333, lng: 48.0833, radius: 3000, priority: 1 },

  // Major Areas
  { name: 'Hawalli', lat: 29.3328, lng: 48.0289, radius: 3000, priority: 2 },
  { name: 'Farwaniya', lat: 29.2797, lng: 47.9589, radius: 3000, priority: 2 },
  { name: 'Ahmadi', lat: 29.0769, lng: 48.0839, radius: 4000, priority: 2 },
  { name: 'Jahra', lat: 29.3375, lng: 47.6581, radius: 4000, priority: 2 },

  // Coastal Areas
  { name: 'Fahaheel', lat: 29.0825, lng: 48.1300, radius: 3000, priority: 2 },
  { name: 'Mangaf', lat: 29.0947, lng: 48.1278, radius: 2000, priority: 3 },
  { name: 'Fintas', lat: 29.1736, lng: 48.1211, radius: 2000, priority: 3 },
  { name: 'Salmiya Coastal', lat: 29.3450, lng: 48.0900, radius: 2000, priority: 3 },

  // Additional Coverage
  { name: 'Jabriya', lat: 29.3167, lng: 48.0167, radius: 2000, priority: 3 },
  { name: 'Salwa', lat: 29.3000, lng: 48.0800, radius: 2000, priority: 3 }
];

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch hotels from Google Places Nearby Search
 */
async function fetchHotelsInZone(zone, apiKey) {
  const allResults = [];

  // Initial search
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.append('location', `${zone.lat},${zone.lng}`);
  url.searchParams.append('radius', zone.radius.toString());
  url.searchParams.append('type', 'lodging'); // Hotels, motels, resorts
  url.searchParams.append('key', apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`   âš ï¸  API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      return allResults;
    }

    if (data.results) {
      allResults.push(...data.results);
    }

    // Handle pagination (up to 60 results per location)
    let nextPageToken = data.next_page_token;
    let pageCount = 1;

    while (nextPageToken && pageCount < 3) {
      await delay(2000); // Required 2-second delay for next_page_token

      const nextUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      nextUrl.searchParams.append('pagetoken', nextPageToken);
      nextUrl.searchParams.append('key', apiKey);

      const nextResponse = await fetch(nextUrl.toString());
      const nextData = await nextResponse.json();

      if (nextData.status === 'OK' && nextData.results) {
        allResults.push(...nextData.results);
        pageCount++;
      }

      nextPageToken = nextData.next_page_token;
    }

    return allResults;

  } catch (error) {
    console.error(`   âŒ Error fetching zone: ${error.message}`);
    return allResults;
  }
}

/**
 * Main discovery function
 */
async function discoverHotels() {
  console.log('ðŸ¨ GOA HOTEL DISCOVERY');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('âŒ GOOGLE_PLACES_API_KEY not found in .env.local');
    console.error('   Please add your Google Places API key to continue.\n');
    process.exit(1);
  }

  console.log(`ðŸ“ Searching ${GOA_ZONES.length} geographic zones in Goa\n`);

  const allHotels = new Map(); // Deduplicate by place_id
  let totalApiCalls = 0;

  // Search each zone
  for (let i = 0; i < GOA_ZONES.length; i++) {
    const zone = GOA_ZONES[i];
    const progress = `[${i + 1}/${GOA_ZONES.length}]`;

    console.log(`${progress} Searching: ${zone.name} (radius: ${zone.radius}m)`);

    const results = await fetchHotelsInZone(zone, apiKey);
    totalApiCalls += Math.ceil(results.length / 20); // Estimate API calls

    let newCount = 0;
    for (const place of results) {
      if (!allHotels.has(place.place_id)) {
        allHotels.set(place.place_id, {
          place_id: place.place_id,
          name: place.name,
          area: zone.name,
          address: place.vicinity || '',
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          price_level: place.price_level || null,
          lat: place.geometry?.location?.lat || null,
          lng: place.geometry?.location?.lng || null,
          business_status: place.business_status || 'UNKNOWN',
          types: place.types || [],
          photos: place.photos?.length || 0
        });
        newCount++;
      }
    }

    console.log(`   Found ${results.length} results (${newCount} new, ${allHotels.size} unique total)`);

    // Rate limiting: 1 second between zones
    if (i < GOA_ZONES.length - 1) {
      await delay(1000);
    }
  }

  console.log('\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log(`âœ… DISCOVERY COMPLETE\n`);
  console.log(`   Total unique hotels: ${allHotels.size}`);
  console.log(`   Estimated API cost: $${(totalApiCalls * 0.032).toFixed(2)}\n`);

  // Convert to array
  const hotelsArray = Array.from(allHotels.values());

  // Apply filters
  const activeHotels = hotelsArray.filter(h =>
    h.business_status === 'OPERATIONAL' || h.business_status === 'OPERATIONAL_BUSINESS'
  );

  const qualityHotels = activeHotels.filter(h => h.user_ratings_total >= 10);

  console.log('ðŸ“Š FILTERING RESULTS\n');
  console.log(`   Active hotels: ${activeHotels.length}`);
  console.log(`   With 10+ reviews: ${qualityHotels.length}\n`);

  // Categorize by rating tiers
  const tier1 = qualityHotels.filter(h => h.rating >= 4.5 && h.user_ratings_total >= 200);
  const tier2 = qualityHotels.filter(h => h.rating >= 4.0 && h.rating < 4.5 && h.user_ratings_total >= 100);
  const tier3 = qualityHotels.filter(h => h.rating >= 3.5 && h.rating < 4.0 && h.user_ratings_total >= 50);
  const belowThreshold = qualityHotels.filter(h => h.rating < 3.5 || h.user_ratings_total < 50);

  // Filter for 4.0+ rating (Douglas's requirement)
  const targetHotels = qualityHotels.filter(h => h.rating >= 4.0);

  console.log('ðŸ† TIER BREAKDOWN\n');
  console.log(`   Tier 1 (4.5+ rating, 200+ reviews): ${tier1.length} hotels`);
  console.log(`   Tier 2 (4.0-4.49 rating, 100+ reviews): ${tier2.length} hotels`);
  console.log(`   Tier 3 (3.5-3.99 rating, 50+ reviews): ${tier3.length} hotels`);
  console.log(`   Below threshold (<3.5 or <50 reviews): ${belowThreshold.length} hotels\n`);

  console.log('ðŸŽ¯ TARGET FOR EXTRACTION (4.0+ RATING)\n');
  console.log(`   Total 4.0+ rated hotels: ${targetHotels.length} hotels`);
  console.log(`   Estimated extraction cost: $${(targetHotels.length * 1.0).toFixed(2)}`);
  console.log(`   Estimated extraction time: ${(targetHotels.length * 3.5 / 60).toFixed(1)} hours\n`);

  // Sort all hotels by rating (desc) then review count (desc)
  qualityHotels.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return b.user_ratings_total - a.user_ratings_total;
  });

  // Save complete results
  const outputPath = path.join(__dirname, '..', 'discovered-hotels.json');
  fs.writeFileSync(outputPath, JSON.stringify(qualityHotels, null, 2));
  console.log(`ðŸ’¾ Saved complete results to: discovered-hotels.json\n`);

  // Save 4.0+ hotels separately
  targetHotels.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return b.user_ratings_total - a.user_ratings_total;
  });

  const targetOutputPath = path.join(__dirname, '..', 'hotels-4.0-plus.json');
  fs.writeFileSync(targetOutputPath, JSON.stringify(targetHotels, null, 2));
  console.log(`ðŸ’¾ Saved 4.0+ hotels to: hotels-4.0-plus.json\n`);

  // Generate summary report
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ“‹ TOP 10 HOTELS (4.0+ RATING)\n');

  targetHotels.slice(0, 10).forEach((hotel, index) => {
    console.log(`${index + 1}. ${hotel.name}`);
    console.log(`   Rating: ${hotel.rating} â­ (${hotel.user_ratings_total} reviews)`);
    console.log(`   Location: ${hotel.area}`);
    console.log(`   Address: ${hotel.address}`);
    console.log(`   Place ID: ${hotel.place_id}\n`);
  });

  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âœ… DISCOVERY COMPLETE - READY FOR EXTRACTION\n');
  console.log('ðŸ“ Output files:');
  console.log('   - discovered-hotels.json (all hotels with 10+ reviews)');
  console.log('   - hotels-4.0-plus.json (target for extraction)\n');
  console.log('ðŸš€ Next step: Review the results, then build hotel extraction system\n');
}

// Run discovery
discoverHotels().catch(error => {
  console.error('âŒ Discovery failed:', error);
  process.exit(1);
});
