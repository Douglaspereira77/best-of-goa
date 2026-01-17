/**
 * Quick Statistics from TripAdvisor Extraction Priority JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '..', 'docs', 'csv', 'tripadvisor-extraction-priority.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('=== TRIPADVISOR CSV QUICK STATS ===\n');
console.log('Total Restaurants:', data.metadata.newToExtract);
console.log('Already in DB:', data.metadata.existingMatches);

console.log('\n=== RATING DISTRIBUTION ===');
const ratings = data.prioritizedNewRestaurants;
const perfect = ratings.filter(r => r.rating === 5).length;
const excellent = ratings.filter(r => r.rating >= 4.5 && r.rating < 5).length;
const veryGood = ratings.filter(r => r.rating >= 4 && r.rating < 4.5).length;
console.log(`5.0 (Perfect): ${perfect} (${((perfect/ratings.length)*100).toFixed(1)}%)`);
console.log(`4.5-4.9 (Excellent): ${excellent} (${((excellent/ratings.length)*100).toFixed(1)}%)`);
console.log(`4.0-4.4 (Very Good): ${veryGood} (${((veryGood/ratings.length)*100).toFixed(1)}%)`);

console.log('\n=== REVIEW COUNT ANALYSIS ===');
const reviews500 = ratings.filter(r => r.reviewCount >= 500).length;
const reviews200 = ratings.filter(r => r.reviewCount >= 200 && r.reviewCount < 500).length;
const reviews100 = ratings.filter(r => r.reviewCount >= 100 && r.reviewCount < 200).length;
const reviews50 = ratings.filter(r => r.reviewCount >= 50 && r.reviewCount < 100).length;
console.log('500+ reviews (Critical Authority):', reviews500);
console.log('200-499 reviews (High Authority):', reviews200);
console.log('100-199 reviews (Good Authority):', reviews100);
console.log('50-99 reviews (Medium):', reviews50);
console.log('Total 100+ reviews:', reviews500 + reviews200 + reviews100);

console.log('\n=== PRICE RANGE DISTRIBUTION ===');
const priceHigh = ratings.filter(r => r.priceRange === '$$$$').length;
const priceMid = ratings.filter(r => r.priceRange === '$$ - $$$').length;
const priceLow = ratings.filter(r => r.priceRange === '$').length;
const priceNA = ratings.filter(r => !r.priceRange).length;
console.log(`$$$$ (Premium): ${priceHigh} (${((priceHigh/ratings.length)*100).toFixed(1)}%)`);
console.log(`$$ - $$$ (Mid-range): ${priceMid} (${((priceMid/ratings.length)*100).toFixed(1)}%)`);
console.log(`$ (Budget): ${priceLow}`);
console.log('Not specified:', priceNA);

console.log('\n=== TOP 5 LOCATIONS ===');
const locations = {};
ratings.forEach(r => locations[r.location] = (locations[r.location] || 0) + 1);
Object.entries(locations).sort((a,b) => b[1] - a[1]).slice(0,5).forEach(([loc, count]) => {
  console.log(`${loc}: ${count}`);
});

console.log('\n=== PRIORITY SCORE DISTRIBUTION ===');
const highPriority = ratings.filter(r => r.priorityScore >= 80).length;
const mediumPriority = ratings.filter(r => r.priorityScore >= 65 && r.priorityScore < 80).length;
const lowPriority = ratings.filter(r => r.priorityScore < 65).length;
console.log(`High Priority (80+): ${highPriority} restaurants`);
console.log(`Medium Priority (65-79): ${mediumPriority} restaurants`);
console.log(`Lower Priority (<65): ${lowPriority} restaurants`);

console.log('\n=== EXTRACTION TIME ESTIMATES ===');
const avgTime = 2.5; // minutes per restaurant
console.log(`High Priority Batch: ~${Math.round(highPriority * avgTime)} minutes (${(highPriority * avgTime / 60).toFixed(1)} hours)`);
console.log(`High + Medium: ~${Math.round((highPriority + mediumPriority) * avgTime)} minutes (${((highPriority + mediumPriority) * avgTime / 60).toFixed(1)} hours)`);
console.log(`Full Dataset: ~${Math.round(ratings.length * avgTime)} minutes (${(ratings.length * avgTime / 60).toFixed(1)} hours)`);

console.log('\n=== COST ESTIMATES ===');
const costPerRestaurant = 1.0; // average $1 per restaurant
console.log(`High Priority Batch: $${(highPriority * costPerRestaurant * 0.7).toFixed(0)}-${(highPriority * costPerRestaurant * 1.3).toFixed(0)}`);
console.log(`High + Medium: $${((highPriority + mediumPriority) * costPerRestaurant * 0.7).toFixed(0)}-${((highPriority + mediumPriority) * costPerRestaurant * 1.3).toFixed(0)}`);
console.log(`Full Dataset: $${(ratings.length * costPerRestaurant * 0.7).toFixed(0)}-${(ratings.length * costPerRestaurant * 1.3).toFixed(0)}`);

console.log('\n=== TOP 10 MUST-HAVE RESTAURANTS ===');
ratings.slice(0, 10).forEach((r, i) => {
  console.log(`${i + 1}. ${r.name} - ${r.rating} (${r.reviewCount} reviews) - ${r.location}`);
});

console.log('\n');
