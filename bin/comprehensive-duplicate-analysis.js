#!/usr/bin/env node

/**
 * COMPREHENSIVE DUPLICATE DETECTION ANALYSIS
 *
 * Multiple matching strategies:
 * 1. Exact name match (case-insensitive)
 * 2. Fuzzy matching (Levenshtein distance)
 * 3. Partial name match
 * 4. Location-based matching
 * 5. Chain restaurant recognition
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const n = str1.length;
  const m = str2.length;

  if (n === 0) return m;
  if (m === 0) return n;

  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[n][m];
}

// Calculate similarity percentage
function similarityScore(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
}

// Normalize restaurant name for comparison
function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes/prefixes
    .replace(/^the\s+/i, '')
    .replace(/\s+(restaurant|resto|cafe|café|coffee|coffeeshop|shop|grill|kitchen|bistro|lounge|bar|pub)$/i, '')
    // Normalize punctuation
    .replace(/[&]/g, 'and')
    .replace(/['']/g, '')
    .replace(/[.,\-_]/g, ' ')
    // Normalize spacing
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract base chain name
function extractChainName(name) {
  const knownChains = [
    'cheesecake factory',
    'p.f. chang',
    'pf chang',
    'jamawar',
    'le notre',
    'paul',
    'shake shack',
    'five guys',
    'hardees',
    'subway',
    'starbucks',
    'costa',
    'mcdonald',
    'kfc',
    'burger king',
    'pizza hut',
    'domino',
    'papa john',
    'nando',
    'wagamama',
    'texas roadhouse',
    'applebee',
    'chili',
    'olive garden',
    'red lobster',
    'ihop',
    'denny',
    'tgif',
    'friday',
    'buffalo',
    'benihana',
    'ihop',
    'carrabba',
    'maggiano',
    'bonefish',
    'outback',
    'longhorn',
    'yard house',
    'seasons 52',
    'eddie v',
    'capital grille',
    'morton',
    'ruth chris',
    'fleming',
    'del frisco',
    'mastro',
    'ocean prime',
    'smith wollensky'
  ];

  const normalized = normalizeName(name);

  for (const chain of knownChains) {
    if (normalized.includes(chain)) {
      return chain;
    }
  }

  return null;
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Parse a CSV line handling quoted values
  const parseLine = (line) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  };

  // Parse header
  const headerValues = parseLine(lines[0]);
  const header = headerValues.map(h => h.replace(/^"|"$/g, ''));

  // Debug: Show headers
  console.log('CSV Headers:', header);

  // Parse rows
  const restaurants = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);

    if (values.length >= header.length) {
      const restaurant = {};
      header.forEach((key, idx) => {
        restaurant[key] = values[idx] || '';
      });
      restaurants.push(restaurant);
    }
  }

  return restaurants;
}

// Detect duplicates
async function detectDuplicates() {
  console.log('🔍 COMPREHENSIVE DUPLICATE DETECTION ANALYSIS\n');
  console.log('='.repeat(80));

  // Read CSV
  const csvPath = path.join(__dirname, '..', 'docs', 'csv', 'Tripadvisor-4-to-5-rating.csv');
  console.log(`\n📄 Reading CSV: ${csvPath}`);
  const csvRestaurants = parseCSV(csvPath);
  console.log(`   Found ${csvRestaurants.length} restaurants in CSV`);

  // Query ALL restaurants from database
  console.log('\n🗄️  Querying complete database...');
  const { data: dbRestaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, area, address, website, status, instagram, facebook');

  if (error) {
    console.error('Database query error:', error);
    process.exit(1);
  }

  console.log(`   Found ${dbRestaurants.length} restaurants in database`);

  // Duplicate detection results
  const results = {
    definiteMatches: [],      // High confidence (90-100%)
    likelyMatches: [],         // Medium confidence (70-89%)
    possibleMatches: [],       // Low confidence (50-69%)
    newRestaurants: [],        // No match found
    chainAnalysis: {}          // Chain restaurant breakdown
  };

  console.log('\n🔎 Analyzing matches...\n');

  // Debug: Show first few CSV restaurants
  console.log('Sample CSV restaurants:');
  csvRestaurants.slice(0, 3).forEach(r => {
    console.log(`  - ${r['Restaurant Name']} (${r['Location']})`);
  });
  console.log('');

  // Debug: Show first few DB restaurants
  console.log('Sample DB restaurants:');
  dbRestaurants.slice(0, 3).forEach(r => {
    console.log(`  - ${r.name} (${r.area})`);
  });
  console.log('');

  // Analyze each CSV restaurant
  for (const csvRest of csvRestaurants) {
    const csvName = csvRest['Restaurant Name'] || '';
    const csvLocation = csvRest['Location'] || '';
    const csvRating = csvRest['Rating'] || '';
    const csvReviews = csvRest['Number of Reviews'] || '';
    const csvCuisine = csvRest['Cuisine Type'] || '';
    const csvPrice = csvRest['Price Range'] || '';

    if (!csvName) continue;

    const csvNormalized = normalizeName(csvName);
    const csvChain = extractChainName(csvName);

    let bestMatch = null;
    let highestScore = 0;
    let matchType = '';

    // Check against all database restaurants
    for (const dbRest of dbRestaurants) {
      const dbName = dbRest.name || '';
      const dbNormalized = normalizeName(dbName);
      const dbArea = dbRest.area || '';

      // Strategy 1: Exact match (case-insensitive)
      if (csvName.toLowerCase() === dbName.toLowerCase()) {
        if (100 > highestScore) {
          bestMatch = dbRest;
          highestScore = 100;
          matchType = 'Exact Match';
        }
        continue;
      }

      // Strategy 2: Exact normalized match
      if (csvNormalized === dbNormalized) {
        if (95 > highestScore) {
          bestMatch = dbRest;
          highestScore = 95;
          matchType = 'Exact Normalized Match';
        }
        continue;
      }

      // Strategy 3: Fuzzy matching
      const similarity = similarityScore(csvNormalized, dbNormalized);
      if (similarity > highestScore && similarity >= 70) {
        bestMatch = dbRest;
        highestScore = similarity;
        matchType = `Fuzzy Match (${similarity.toFixed(1)}% similar)`;
      }

      // Strategy 4: Partial match
      if (csvNormalized.includes(dbNormalized) || dbNormalized.includes(csvNormalized)) {
        const partialScore = 80;
        if (partialScore > highestScore) {
          bestMatch = dbRest;
          highestScore = partialScore;
          matchType = 'Partial Name Match';
        }
      }

      // Strategy 5: Location + name similarity
      if (dbArea && csvLocation.toLowerCase().includes(dbArea.toLowerCase())) {
        const locSimilarity = similarityScore(csvNormalized, dbNormalized);
        if (locSimilarity >= 60) {
          const locationBonus = 15;
          const boostedScore = locSimilarity + locationBonus;
          if (boostedScore > highestScore) {
            bestMatch = dbRest;
            highestScore = boostedScore;
            matchType = `Location + Name Match (${locSimilarity.toFixed(1)}% + location)`;
          }
        }
      }
    }

    // Categorize result
    const matchData = {
      csvRestaurant: {
        name: csvName,
        location: csvLocation,
        rating: csvRating,
        reviews: csvReviews,
        cuisine: csvCuisine,
        priceRange: csvPrice
      },
      dbRestaurant: bestMatch ? {
        id: bestMatch.id,
        name: bestMatch.name,
        area: bestMatch.area,
        address: bestMatch.address,
        status: bestMatch.status
      } : null,
      matchType,
      confidenceScore: highestScore,
      isChain: !!csvChain,
      chainName: csvChain
    };

    // Track chain restaurants
    if (csvChain) {
      if (!results.chainAnalysis[csvChain]) {
        results.chainAnalysis[csvChain] = {
          csvCount: 0,
          dbCount: 0,
          matches: []
        };
      }
      results.chainAnalysis[csvChain].csvCount++;
      if (bestMatch) {
        results.chainAnalysis[csvChain].dbCount++;
        results.chainAnalysis[csvChain].matches.push(matchData);
      }
    }

    // Categorize by confidence
    if (highestScore >= 90) {
      results.definiteMatches.push(matchData);
    } else if (highestScore >= 70) {
      results.likelyMatches.push(matchData);
    } else if (highestScore >= 50) {
      results.possibleMatches.push(matchData);
    } else {
      results.newRestaurants.push(matchData);
    }
  }

  // Generate report
  console.log('📊 ANALYSIS COMPLETE\n');
  console.log('='.repeat(80));
  console.log('\n📈 SUMMARY STATISTICS:\n');
  console.log(`Total restaurants in CSV:           ${csvRestaurants.length}`);
  console.log(`Total restaurants in database:      ${dbRestaurants.length}`);
  console.log(`\n✅ Definite duplicates (90-100%):   ${results.definiteMatches.length}`);
  console.log(`⚠️  Likely duplicates (70-89%):      ${results.likelyMatches.length}`);
  console.log(`❓ Possible duplicates (50-69%):     ${results.possibleMatches.length}`);
  console.log(`🆕 NEW restaurants to extract:       ${results.newRestaurants.length}`);

  const totalDuplicates = results.definiteMatches.length + results.likelyMatches.length;
  const extractionSavings = totalDuplicates * 1.5; // $1.50 per restaurant
  console.log(`\n💰 Extraction cost savings:          $${extractionSavings.toFixed(2)}`);

  // Chain analysis
  console.log('\n🔗 CHAIN RESTAURANT ANALYSIS:\n');
  const chains = Object.entries(results.chainAnalysis).sort((a, b) => b[1].csvCount - a[1].csvCount);
  for (const [chainName, data] of chains) {
    console.log(`   ${chainName.toUpperCase()}`);
    console.log(`   - In CSV: ${data.csvCount} locations`);
    console.log(`   - In DB:  ${data.dbCount} locations`);
    console.log(`   - Missing: ${data.csvCount - data.dbCount} locations\n`);
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'docs', 'TRIPADVISOR_DUPLICATE_ANALYSIS.md');
  const report = generateMarkdownReport(results, csvRestaurants.length, dbRestaurants.length);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📝 Detailed report saved: ${reportPath}`);

  // Save deduplicated extraction list
  const extractionListPath = path.join(__dirname, '..', 'docs', 'csv', 'tripadvisor-extraction-priority-deduplicated.json');
  const extractionList = results.newRestaurants.map((item, index) => ({
    priority: index + 1,
    name: item.csvRestaurant.name,
    location: item.csvRestaurant.location,
    rating: parseFloat(item.csvRestaurant.rating) || 0,
    reviewCount: parseInt(item.csvRestaurant.reviews) || 0,
    cuisine: item.csvRestaurant.cuisine,
    priceRange: item.csvRestaurant.priceRange,
    reason: 'No match found in database'
  }));
  fs.writeFileSync(extractionListPath, JSON.stringify(extractionList, null, 2));
  console.log(`📋 Extraction list saved: ${extractionListPath}`);

  // Save manual review list
  if (results.likelyMatches.length > 0 || results.possibleMatches.length > 0) {
    const reviewListPath = path.join(__dirname, '..', 'docs', 'csv', 'tripadvisor-needs-manual-review.json');
    const reviewList = [...results.likelyMatches, ...results.possibleMatches].map(item => ({
      csvName: item.csvRestaurant.name,
      csvLocation: item.csvRestaurant.location,
      dbId: item.dbRestaurant?.id,
      dbName: item.dbRestaurant?.name,
      dbArea: item.dbRestaurant?.area,
      matchType: item.matchType,
      confidence: item.confidenceScore,
      recommendation: item.confidenceScore >= 70 ? 'Likely Duplicate' : 'Needs Review'
    }));
    fs.writeFileSync(reviewListPath, JSON.stringify(reviewList, null, 2));
    console.log(`⚠️  Manual review list saved: ${reviewListPath}`);
  }

  console.log('\n✅ Analysis complete!\n');
}

// Generate markdown report
function generateMarkdownReport(results, csvTotal, dbTotal) {
  const totalDuplicates = results.definiteMatches.length + results.likelyMatches.length;
  const extractionSavings = totalDuplicates * 1.5;

  let report = `# TripAdvisor Duplicate Detection Analysis

**Generated:** ${new Date().toISOString()}

## Executive Summary

- **Total CSV Restaurants:** ${csvTotal}
- **Total DB Restaurants:** ${dbTotal}
- **✅ Definite Duplicates (90-100%):** ${results.definiteMatches.length}
- **⚠️ Likely Duplicates (70-89%):** ${results.likelyMatches.length}
- **❓ Possible Duplicates (50-69%):** ${results.possibleMatches.length}
- **🆕 NEW Restaurants:** ${results.newRestaurants.length}
- **💰 Cost Savings:** $${extractionSavings.toFixed(2)}

## Methodology

This analysis uses **5 matching strategies**:

1. **Exact Match:** Direct case-insensitive comparison
2. **Normalized Match:** After removing common words and punctuation
3. **Fuzzy Match:** Levenshtein distance algorithm (70%+ similarity)
4. **Partial Match:** One name contains the other
5. **Location + Name:** Name similarity + matching area/neighborhood

## Chain Restaurant Analysis

`;

  const chains = Object.entries(results.chainAnalysis).sort((a, b) => b[1].csvCount - a[1].csvCount);
  for (const [chainName, data] of chains) {
    report += `### ${chainName.toUpperCase()}\n`;
    report += `- **CSV Locations:** ${data.csvCount}\n`;
    report += `- **DB Locations:** ${data.dbCount}\n`;
    report += `- **Missing:** ${data.csvCount - data.dbCount}\n\n`;
  }

  report += `## Definite Duplicates (High Confidence: 90-100%)\n\n`;
  report += `**Count:** ${results.definiteMatches.length}\n\n`;

  for (const match of results.definiteMatches) {
    report += `### ${match.csvRestaurant.name}\n`;
    report += `- **Match Type:** ${match.matchType}\n`;
    report += `- **Confidence:** ${match.confidenceScore.toFixed(1)}%\n`;
    report += `- **CSV Location:** ${match.csvRestaurant.location}\n`;
    report += `- **DB Match:** ${match.dbRestaurant.name} (ID: ${match.dbRestaurant.id})\n`;
    report += `- **DB Area:** ${match.dbRestaurant.area || 'N/A'}\n`;
    report += `- **Status:** ${match.dbRestaurant.status}\n`;
    report += `- **Recommendation:** ✅ SKIP - Already in database\n\n`;
  }

  report += `## Likely Duplicates (Medium Confidence: 70-89%)\n\n`;
  report += `**Count:** ${results.likelyMatches.length}\n\n`;

  for (const match of results.likelyMatches) {
    report += `### ${match.csvRestaurant.name}\n`;
    report += `- **Match Type:** ${match.matchType}\n`;
    report += `- **Confidence:** ${match.confidenceScore.toFixed(1)}%\n`;
    report += `- **CSV Location:** ${match.csvRestaurant.location}\n`;
    report += `- **DB Match:** ${match.dbRestaurant.name} (ID: ${match.dbRestaurant.id})\n`;
    report += `- **DB Area:** ${match.dbRestaurant.area || 'N/A'}\n`;
    report += `- **Recommendation:** ⚠️ MANUAL REVIEW REQUIRED\n\n`;
  }

  report += `## Possible Duplicates (Low Confidence: 50-69%)\n\n`;
  report += `**Count:** ${results.possibleMatches.length}\n\n`;

  for (const match of results.possibleMatches) {
    report += `### ${match.csvRestaurant.name}\n`;
    report += `- **Match Type:** ${match.matchType}\n`;
    report += `- **Confidence:** ${match.confidenceScore.toFixed(1)}%\n`;
    report += `- **CSV Location:** ${match.csvRestaurant.location}\n`;
    report += `- **DB Match:** ${match.dbRestaurant.name} (ID: ${match.dbRestaurant.id})\n`;
    report += `- **DB Area:** ${match.dbRestaurant.area || 'N/A'}\n`;
    report += `- **Recommendation:** ❓ MANUAL REVIEW REQUIRED\n\n`;
  }

  report += `## NEW Restaurants to Extract\n\n`;
  report += `**Count:** ${results.newRestaurants.length}\n\n`;

  // Show first 20 as sample
  const sampleNew = results.newRestaurants.slice(0, 20);
  for (const item of sampleNew) {
    report += `- **${item.csvRestaurant.name}** (${item.csvRestaurant.location}) - ${item.csvRestaurant.rating}⭐ - ${item.csvRestaurant.reviews} reviews\n`;
  }

  if (results.newRestaurants.length > 20) {
    report += `\n... and ${results.newRestaurants.length - 20} more (see extraction list JSON)\n`;
  }

  report += `\n## Next Steps\n\n`;
  report += `1. ✅ **Skip definite duplicates** (${results.definiteMatches.length} restaurants)\n`;
  report += `2. ⚠️ **Manual review required** (${results.likelyMatches.length + results.possibleMatches.length} restaurants)\n`;
  report += `3. 🆕 **Extract NEW restaurants** (${results.newRestaurants.length} restaurants)\n`;
  report += `4. 💰 **Estimated extraction cost:** $${(results.newRestaurants.length * 1.5).toFixed(2)}\n`;

  return report;
}

// Run analysis
detectDuplicates().catch(console.error);
