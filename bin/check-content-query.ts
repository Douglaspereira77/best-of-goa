
import * as dotenv from 'dotenv';
import path from 'path';

// Fix aliases for tsx if needed, or just use relative imports
// Validating simple import first.
import { getRestaurantBySlug } from '../src/lib/queries/restaurant';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// We need to initialize admin manually because we are running a script, 
// BUT getRestaurantBySlug imports adminDb from lib/firebase/admin which might be lazily initialized?
// checking lib/firebase/admin.ts:
/*
import * as admin from 'firebase-admin';
...
if (!admin.apps.length) { admin.initializeApp(...) }
export const adminDb = admin.firestore();
*/
// So just importing getRestaurantBySlug should trigger the init if env vars are present.

async function main() {
    const slug = 'ritz-classic-panjim-panjim';
    console.log(`Fetching ${slug} using getRestaurantBySlug...`);

    try {
        const data = await getRestaurantBySlug(slug);

        if (!data) {
            console.log('Restaurant not found via query function.');
            return;
        }

        console.log('--- DATA RETURNED BY QUERY FUNCTION ---');
        console.log('Name:', data.name);
        console.log('Description Base:', data.description ? 'Present' : 'Missing');
        console.log('Review Sentiment:', data.review_sentiment || 'MISSING');
        console.log('FAQs Array Length:', data.faqs?.length || 0);
        if (data.faqs && data.faqs.length > 0) {
            console.log('First FAQ Question:', data.faqs[0].question);
        }

    } catch (e) {
        console.error('Error fetching:', e);
    }
}

main();
