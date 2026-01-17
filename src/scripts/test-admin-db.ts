
import dotenv from 'dotenv';
import path from 'path';

// Load env before importing admin
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('Testing Admin DB...');
    console.log('FIREBASE_SERVICE_ACCOUNT_KEY present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log('Key length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length);
        try {
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            console.log('Key JSON Valid');
        } catch (e) {
            console.error('Key JSON Invalid:', e);
        }
    }

    // Dynamic import to ensure env is loaded first
    const { adminDb } = await import('../lib/firebase/admin');

    if (!adminDb) {
        console.error('adminDb is null!');
        process.exit(1);
    }

    console.log('adminDb initialized. Fetching restaurants...');
    try {
        const snapshot = await adminDb.collection('restaurants').limit(5).get();
        console.log(`Found ${snapshot.size} restaurants.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ${data.name} (Rating: ${data.google_rating}, ID: ${doc.id})`);
        });
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

main().catch(console.error);
