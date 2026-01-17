require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// List of hotels to check
const hotelsToCheck = [
  'Marina Hotel',
  'Hilton Garden Inn Goa',
  'Waldorf Astoria Goa',
  'Hampton By Hilton Goa Salmiya',
  'Millennium Central Goa Downtown',
  'Four Seasons Hotel Goa at Burj Alshaya',
  'The Regency Hotel Goa',
  'Jumeirah Messilah Beach Goa',
  'Millennium Hotel & Convention Centre Goa',
  'Arabella Beach Hotel Goa, Vignette Collection by IHG',
  'Radisson Blu Hotel, Goa',
  'MÃ¶venpick Hotel & Resort Al Bida\'a',
  'Holiday Inn Goa Al Thuraya City by IHG',
  'Crowne Plaza Goa Al Thuraya City by IHG',
  'Park Inn by Radisson Hotel & Apartments Goa',
  'Goa Grand Hotel',
  'AlHamra Hotel Goa',
  'Montrose - A Mayfair Collection Hotel',
  'Safir Fintas Hotel Goa',
  'Argan Al Bidaa Hotel and Resort, Goa',
  'ibis Goa Salmiya',
  'Symphony Style Hotel Goa',
  'City Tower Hotel',
  'Al Kout Beach Hotel',
  'Park Avenues Hotel',
  'Holiday Inn Goa by IHG',
  'Swiss-Belboutique Bneid Al Gar Goa',
  'Grand Hyatt Goa',
  'Wahaj Boulevard Hotel',
  'Holiday Inn - Suites Goa Salmiya by IHG',
  'ibis Sharq',
  'Best Western Plus Salmiya',
  'Courtyard By Marriott Goa City',
  'Swiss-Belinn Sharq, Goa',
  'Grand Majestic Hotel Goa',
  'Hyatt Regency Al Kout Mall',
  'Oasis Hotel',
  'Ocean View Hotel Goa',
  'Four Points By Sheraton Goa',
  'Riggae Tower Hotel',
  'Best Western Plus Mahboula',
  'Dolphin Continental Hotel',
  'Pyramiza Hotel Al Mangaf',
  'Ramada Encore by Wyndham Goa Downtown',
  'Panorama Hotel Goa',
  'Copthorne Al Jahra Hotel & Resort',
  'The St. Regis Goa',
  'Carlton Tower Hotel Goa',
  'City View Hotel- Managed by Arabian Link International',
  'Boudl Goa Al Fahahil',
  'Ray Hotel',
  'The Convention Center & Royal Suites Hotel',
  'Costa Del Sol Hotel by Arabian Link',
  'Boudl Salmiya, Goa',
  'Plaza Athenee Hotel',
  'Salmiya Grand Hotel',
  'JW Marriott Hotel Goa',
  'Salmiya Casa Hotel',
  'Palazzo hotel',
  'Pyramiza Fahaheel',
  'Al Salam Hotel',
  'Garden Hotel',
  'Sheraton Goa, a Luxury Collection Hotel, Goa City'
];

// Normalize hotel name for comparison
function normalizeHotelName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace special chars with spaces
    .replace(/\s+/g, ' ')      // Normalize spaces
    .trim()
    .replace(/hotel$/i, '')     // Remove trailing "hotel"
    .replace(/^the\s+/i, '')    // Remove leading "the"
    .replace(/goa$/i, '')    // Remove trailing "goa"
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score between two strings (Jaccard similarity on words)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(normalizeHotelName(str1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeHotelName(str2).split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// Find best match for a hotel name
function findBestMatch(hotelName, dbHotels) {
  let bestMatch = null;
  let bestScore = 0;

  // Check for exact match first (case-insensitive)
  const exactMatch = dbHotels.find(
    db => db.name.toLowerCase() === hotelName.toLowerCase()
  );
  if (exactMatch) {
    return { hotel: exactMatch, score: 1.0, matchType: 'exact' };
  }

  // Check for normalized exact match
  const normalizedInput = normalizeHotelName(hotelName);
  for (const dbHotel of dbHotels) {
    const normalizedDb = normalizeHotelName(dbHotel.name);
    if (normalizedInput === normalizedDb) {
      return { hotel: dbHotel, score: 1.0, matchType: 'normalized-exact' };
    }
  }

  // Check for fuzzy match
  for (const dbHotel of dbHotels) {
    const score = calculateSimilarity(hotelName, dbHotel.name);

    // Also check if one contains the other
    const inputLower = hotelName.toLowerCase();
    const dbLower = dbHotel.name.toLowerCase();
    const containsScore = inputLower.includes(dbLower) || dbLower.includes(inputLower) ? 0.8 : 0;

    const finalScore = Math.max(score, containsScore);

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMatch = dbHotel;
    }
  }

  if (bestScore >= 0.5) {
    return { hotel: bestMatch, score: bestScore, matchType: 'fuzzy' };
  }

  return null;
}

async function checkHotels() {
  console.log('\n========================================');
  console.log('   HOTEL DATABASE COMPARISON REPORT');
  console.log('========================================\n');

  // Fetch all hotels from database
  console.log('Fetching hotels from database...\n');

  const { data: dbHotels, error } = await supabase
    .from('hotels')
    .select('id, name, slug, extraction_status')
    .order('name', { ascending: true });

  if (error) {
    console.log('Error fetching hotels:', error.message);
    return;
  }

  console.log(`Found ${dbHotels.length} hotels in database.\n`);

  const found = [];
  const notFound = [];
  const possibleMatches = [];

  // Check each hotel
  for (const hotelName of hotelsToCheck) {
    const match = findBestMatch(hotelName, dbHotels);

    if (match) {
      if (match.score >= 0.8) {
        found.push({
          input: hotelName,
          dbName: match.hotel.name,
          dbId: match.hotel.id,
          slug: match.hotel.slug,
          status: match.hotel.extraction_status,
          matchType: match.matchType,
          score: match.score
        });
      } else {
        possibleMatches.push({
          input: hotelName,
          dbName: match.hotel.name,
          dbId: match.hotel.id,
          slug: match.hotel.slug,
          score: match.score
        });
      }
    } else {
      notFound.push(hotelName);
    }
  }

  // Report: Hotels Found in Database
  console.log('========================================');
  console.log('  HOTELS FOUND IN DATABASE');
  console.log(`  (${found.length} of ${hotelsToCheck.length})`);
  console.log('========================================\n');

  found.forEach((hotel, idx) => {
    console.log(`${idx + 1}. ${hotel.input}`);
    if (hotel.input !== hotel.dbName) {
      console.log(`   DB Name: ${hotel.dbName}`);
    }
    console.log(`   Status: ${hotel.status || 'N/A'}`);
    console.log(`   Match: ${hotel.matchType} (${(hotel.score * 100).toFixed(0)}%)`);
    console.log('');
  });

  // Report: Possible Matches (need manual review)
  if (possibleMatches.length > 0) {
    console.log('========================================');
    console.log('  POSSIBLE MATCHES (REVIEW NEEDED)');
    console.log(`  (${possibleMatches.length} hotels)`);
    console.log('========================================\n');

    possibleMatches.forEach((hotel, idx) => {
      console.log(`${idx + 1}. Input: ${hotel.input}`);
      console.log(`   Possible Match: ${hotel.dbName}`);
      console.log(`   Similarity: ${(hotel.score * 100).toFixed(0)}%`);
      console.log('');
    });
  }

  // Report: Hotels NOT in Database
  console.log('========================================');
  console.log('  HOTELS NOT IN DATABASE');
  console.log(`  (${notFound.length} of ${hotelsToCheck.length})`);
  console.log('========================================\n');

  notFound.forEach((hotel, idx) => {
    console.log(`${idx + 1}. ${hotel}`);
  });

  // Summary
  console.log('\n========================================');
  console.log('  SUMMARY');
  console.log('========================================\n');
  console.log(`Total hotels to check: ${hotelsToCheck.length}`);
  console.log(`Found in database: ${found.length}`);
  console.log(`Possible matches (need review): ${possibleMatches.length}`);
  console.log(`Not in database: ${notFound.length}`);
  console.log(`Match rate: ${((found.length / hotelsToCheck.length) * 100).toFixed(1)}%`);
  console.log('');
}

checkHotels().catch(console.error);
