#!/usr/bin/env node

/**
 * MERGE HOTEL LISTS - TripAdvisor + Google Places
 *
 * Compares TripAdvisor hotel list with Google Places discovery
 * Identifies missing hotels and creates a comprehensive extraction list
 *
 * Usage: node bin/merge-hotel-lists.js
 */

const fs = require('fs');
const path = require('path');

// Normalize hotel name for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/\b(hotel|goa|by|ihg|collection|the)\b/g, '') // Remove common words
    .trim();
}

// Calculate similarity between two strings (simple word overlap)
function calculateSimilarity(name1, name2) {
  const words1 = normalizeName(name1).split(' ').filter(w => w.length > 2);
  const words2 = normalizeName(name2).split(' ').filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);

  return similarity;
}

// Parse TripAdvisor CSV
function parseTripAdvisorCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');
  const hotels = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV (handle quoted fields)
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    const name = parts[0] || '';
    const rating = parseFloat(parts[1]) || 0;
    const price = parts[2] ? parseInt(parts[2].replace(/[^0-9]/g, '')) : 0;

    if (name) {
      hotels.push({
        name: name,
        tripadvisor_rating: rating,
        price_usd: price,
        source: 'tripadvisor'
      });
    }
  }

  return hotels;
}

// Load Google Places discovered hotels
function loadGooglePlacesHotels(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

// Find best match in Google Places list
function findBestMatch(tripAdvisorHotel, googlePlacesHotels) {
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const gpHotel of googlePlacesHotels) {
    const similarity = calculateSimilarity(tripAdvisorHotel.name, gpHotel.name);
    if (similarity > bestSimilarity && similarity > 0.4) { // 40% threshold
      bestSimilarity = similarity;
      bestMatch = gpHotel;
    }
  }

  return { match: bestMatch, similarity: bestSimilarity };
}

async function mergeHotelLists() {
  console.log('ðŸ¨ MERGE HOTEL LISTS');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  // Load TripAdvisor list
  const tripAdvisorPath = 'C:\\Users\\Douglas\\Downloads\\Trip Advisor Hotel list - Sheet1.csv';

  if (!fs.existsSync(tripAdvisorPath)) {
    console.error('âŒ TripAdvisor CSV not found at:', tripAdvisorPath);
    console.error('   Please ensure the file exists.\n');
    process.exit(1);
  }

  console.log('ðŸ“Š Loading TripAdvisor list...');
  const tripAdvisorHotels = parseTripAdvisorCSV(tripAdvisorPath);
  console.log(`   Found ${tripAdvisorHotels.length} hotels\n`);

  // Load Google Places list
  const googlePlacesPath = path.join(__dirname, '..', 'hotels-legitimate-4.0-plus.json');
  console.log('ðŸ“Š Loading Google Places list...');
  const googlePlacesHotels = loadGooglePlacesHotels(googlePlacesPath);
  console.log(`   Found ${googlePlacesHotels.length} hotels\n`);

  // Analyze matches
  console.log('ðŸ” ANALYZING MATCHES');
  console.log('â”€'.repeat(60) + '\n');

  const matched = [];
  const missingFromGoogle = [];
  const lowRatedTripadvisor = [];
  const noRatingTripadvisor = [];

  for (const taHotel of tripAdvisorHotels) {
    // Categorize by rating
    if (!taHotel.tripadvisor_rating) {
      noRatingTripadvisor.push(taHotel);
      continue;
    }

    if (taHotel.tripadvisor_rating < 4.0) {
      lowRatedTripadvisor.push(taHotel);
      continue;
    }

    // Try to match with Google Places
    const { match, similarity } = findBestMatch(taHotel, googlePlacesHotels);

    if (match && similarity > 0.5) {
      matched.push({
        tripadvisor: taHotel,
        googlePlaces: match,
        similarity: similarity
      });
    } else {
      missingFromGoogle.push(taHotel);
    }
  }

  // Report results
  console.log('ðŸ“Š SUMMARY\n');
  console.log(`   Total TripAdvisor hotels: ${tripAdvisorHotels.length}`);
  console.log(`   â”œâ”€ With 4.0+ rating: ${matched.length + missingFromGoogle.length}`);
  console.log(`   â”œâ”€ Below 4.0 rating: ${lowRatedTripadvisor.length}`);
  console.log(`   â””â”€ No rating: ${noRatingTripadvisor.length}\n`);

  console.log(`   Matched to Google Places: ${matched.length}`);
  console.log(`   Missing from Google Places: ${missingFromGoogle.length}\n`);

  // Show missing hotels
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âŒ HOTELS MISSING FROM GOOGLE PLACES (4.0+ RATING)\n');

  // Sort by rating then price
  missingFromGoogle.sort((a, b) => {
    if (b.tripadvisor_rating !== a.tripadvisor_rating) {
      return b.tripadvisor_rating - a.tripadvisor_rating;
    }
    return b.price_usd - a.price_usd;
  });

  missingFromGoogle.forEach((hotel, index) => {
    console.log(`${index + 1}. ${hotel.name}`);
    console.log(`   Rating: ${hotel.tripadvisor_rating}â­ | Price: $${hotel.price_usd || 'N/A'}/night\n`);
  });

  // Show matched hotels
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âœ… MATCHED HOTELS (Already in Google Places)\n');

  matched.sort((a, b) => b.similarity - a.similarity);
  matched.slice(0, 10).forEach((match, index) => {
    console.log(`${index + 1}. ${match.tripadvisor.name}`);
    console.log(`   â†’ ${match.googlePlaces.name} (${Math.round(match.similarity * 100)}% match)`);
    console.log(`   TA: ${match.tripadvisor.tripadvisor_rating}â­ | GP: ${match.googlePlaces.rating}â­\n`);
  });
  if (matched.length > 10) {
    console.log(`   ... and ${matched.length - 10} more matched hotels\n`);
  }

  // Create comprehensive list for extraction
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸŽ¯ CREATING COMPREHENSIVE EXTRACTION LIST\n');

  const extractionList = [];

  // Add all Google Places hotels (they have place_id)
  for (const gpHotel of googlePlacesHotels) {
    extractionList.push({
      name: gpHotel.name,
      place_id: gpHotel.place_id,
      area: gpHotel.area,
      google_rating: gpHotel.rating,
      google_reviews: gpHotel.user_ratings_total,
      tripadvisor_rating: null,
      price_usd: null,
      source: 'google_places',
      needs_place_id: false
    });
  }

  // Add missing TripAdvisor hotels (need place_id lookup)
  for (const taHotel of missingFromGoogle) {
    extractionList.push({
      name: taHotel.name,
      place_id: null,
      area: null,
      google_rating: null,
      google_reviews: null,
      tripadvisor_rating: taHotel.tripadvisor_rating,
      price_usd: taHotel.price_usd,
      source: 'tripadvisor',
      needs_place_id: true
    });
  }

  console.log(`   Google Places hotels (ready): ${googlePlacesHotels.length}`);
  console.log(`   TripAdvisor additions (need place_id): ${missingFromGoogle.length}`);
  console.log(`   Total comprehensive list: ${extractionList.length}\n`);

  // Save outputs
  const missingPath = path.join(__dirname, '..', 'hotels-missing-from-discovery.json');
  fs.writeFileSync(missingPath, JSON.stringify(missingFromGoogle, null, 2));
  console.log(`ðŸ’¾ Saved missing hotels to: hotels-missing-from-discovery.json`);

  const comprehensivePath = path.join(__dirname, '..', 'hotels-comprehensive-list.json');
  fs.writeFileSync(comprehensivePath, JSON.stringify(extractionList, null, 2));
  console.log(`ðŸ’¾ Saved comprehensive list to: hotels-comprehensive-list.json`);

  const matchedPath = path.join(__dirname, '..', 'hotels-matched.json');
  fs.writeFileSync(matchedPath, JSON.stringify(matched, null, 2));
  console.log(`ðŸ’¾ Saved matched hotels to: hotels-matched.json\n`);

  // Cost estimation
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ’° EXTRACTION COST ESTIMATE\n');

  const readyCount = googlePlacesHotels.length;
  const needsLookupCount = missingFromGoogle.length;

  console.log(`   Ready for extraction: ${readyCount} hotels`);
  console.log(`   Need place_id lookup: ${needsLookupCount} hotels`);
  console.log(`   Total hotels: ${readyCount + needsLookupCount}`);
  console.log(`\n   Estimated cost: $${(readyCount + needsLookupCount).toFixed(2)}`);
  console.log(`   Estimated time: ${((readyCount + needsLookupCount) * 3.5 / 60).toFixed(1)} hours\n`);

  // Next steps
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸš€ NEXT STEPS\n');
  console.log('1. Review hotels-missing-from-discovery.json');
  console.log('2. Get Google Place IDs for missing hotels (Google Places Text Search)');
  console.log('3. Merge into final extraction list');
  console.log('4. Run bulk extraction with bin/extract-hotels-from-discovery.js\n');

  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('âœ… MERGE COMPLETE\n');
}

mergeHotelLists().catch(error => {
  console.error('âŒ Merge failed:', error);
  process.exit(1);
});
