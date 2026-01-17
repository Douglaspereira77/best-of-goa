import * as dotenv from 'dotenv';
import path from 'path';
import { adminDb } from '../src/lib/firebase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const slug = 'ritz-classic-panjim-panjim';
    console.log(`Checking images for ${slug}...\n`);

    try {
        const restaurantDoc = await adminDb.collection('restaurants').doc(slug).get();

        if (!restaurantDoc.exists) {
            console.log('Restaurant not found.');
            return;
        }

        const data = restaurantDoc.data();

        console.log('--- RESTAURANT DATA ---');
        console.log('Name:', data?.name);
        console.log('Hero Image:', data?.hero_image || 'MISSING');
        console.log('\n--- IMAGES SUBCOLLECTION ---');

        const imagesSnapshot = await adminDb
            .collection('restaurants')
            .doc(slug)
            .collection('images')
            .get();

        if (imagesSnapshot.empty) {
            console.log('No images in subcollection.');
        } else {
            console.log(`Found ${imagesSnapshot.size} images:\n`);
            imagesSnapshot.docs.forEach((doc, idx) => {
                const img = doc.data();
                console.log(`Image ${idx + 1}:`);
                console.log('  ID:', doc.id);
                console.log('  URL:', img.url || 'MISSING');
                console.log('  Alt:', img.alt_text || 'MISSING');
                console.log('  Category:', img.category || 'none');
                console.log('');
            });
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
