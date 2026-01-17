
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

import { adminDb } from '../lib/firebase/admin';

if (!adminDb) {
    console.log('Admin not initialized');
    process.exit(1);
}

async function check() {
    const snap = await adminDb.collection('restaurants_cuisines').count().get();
    console.log(`Cuisines count: ${snap.data().count}`);
}

check().catch(console.error);
