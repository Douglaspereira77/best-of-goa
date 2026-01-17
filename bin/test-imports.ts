import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Testing imports...');

import { ratingCalculator } from '../src/lib/services/rating-calculator';
console.log('✓ Rating calculator imported');

import { sentimentAnalyzer } from '../src/lib/services/sentiment-analyzer';
console.log('✓ Sentiment analyzer imported');

import { tripadvisorScraper } from '../src/lib/services/tripadvisor-scraper';
console.log('✓ TripAdvisor scraper imported');

console.log('\n✅ All services imported successfully!');
process.exit(0);
