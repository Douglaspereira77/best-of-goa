
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// Static imports for utils
import { GOA_DISTRICTS, getAreasByDistrict } from '../lib/utils/goa-locations';

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function seedNeighborhoods() {
    // Dynamic import to ensure env vars are loaded first
    const { adminDb } = await import('../lib/firebase/admin');

    if (!adminDb) {
        console.error('Firebase Admin not initialized - Check FIREBASE_SERVICE_ACCOUNT_KEY');
        process.exit(1);
    }

    const db = adminDb;
    console.log('Seeding Neighborhoods...');

    const northAreas = getAreasByDistrict(GOA_DISTRICTS.NORTH_GOA);
    const southAreas = getAreasByDistrict(GOA_DISTRICTS.SOUTH_GOA);

    const allNeighborhoods = [
        ...northAreas.map(area => ({ name: area, district: 'North Goa' })),
        ...southAreas.map(area => ({ name: area, district: 'South Goa' }))
    ];

    const batch = db.batch();
    const collectionRef = db.collection('neighborhoods');

    let count = 0;

    for (const item of allNeighborhoods) {
        const slug = slugify(item.name);
        const docRef = collectionRef.doc(slug);

        batch.set(docRef, {
            id: slug,
            name: item.name,
            slug: slug,
            district: item.district,
            active: true
        }, { merge: true });

        count++;
    }

    await batch.commit();
    console.log(`Seeded ${count} neighborhoods to 'neighborhoods' collection.`);
}

seedNeighborhoods().catch(console.error);
