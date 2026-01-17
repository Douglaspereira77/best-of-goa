
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });


async function check() {
    const { adminDb } = await import('../lib/firebase/admin');
    if (!adminDb) {
        console.log('Admin not initialized');
        process.exit(1);
    }
    const snap = await adminDb.collection('restaurants').count().get();
    console.log(`Restaurants count: ${snap.data().count}`);

    // List a few if any
    if (snap.data().count > 0) {
        const query = await adminDb.collection('restaurants').limit(3).get();
        query.forEach(doc => console.log(`- ${doc.id}: ${doc.data().name} (${doc.data().area})`));
    }
}

check().catch(console.error);
