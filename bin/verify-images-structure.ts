import * as dotenv from 'dotenv';
import path from 'path';
import { adminDb } from '../src/lib/firebase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const slug = 'ritz-classic-panjim-panjim';
    console.log(`Checking complete data for ${slug}...\n`);

    try {
        const restaurantDoc = await adminDb.collection('restaurants').doc(slug).get();

        if (!restaurantDoc.exists) {
            console.log('Restaurant not found.');
            return;
        }

        const data = restaurantDoc.data();

        console.log('=== RESTAURANT DOCUMENT ===');
        console.log('Name:', data?.name);
        console.log('Slug:', data?.slug);
        console.log('Hero Image:', data?.hero_image || 'MISSING');
        console.log('\nImages Field Type:', typeof data?.images);
        console.log('Images Is Array:', Array.isArray(data?.images));

        if (data?.images) {
            console.log(`\n--- IMAGES ARRAY (${data.images.length} items) ---`);
            data.images.forEach((img: any, idx: number) => {
                console.log(`\nImage ${idx + 1}:`);
                console.log('  URL:', img.url || 'MISSING');
                console.log('  Alt:', img.alt || 'MISSING');
                console.log('  Is Hero:', img.is_hero || false);
            });
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
