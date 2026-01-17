
import { adminDb } from '@/lib/firebase/admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    console.log('Verifying Restaurant Images...');
    const snapshot = await adminDb.collection('restaurants').get();
    const total = snapshot.size;

    let withImages = 0;
    let withHero = 0;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.images && data.images.length > 0) withImages++;
        if (data.hero_image) withHero++;
    });

    console.log(`Total Restaurants: ${total}`);
    console.log(`With Images: ${withImages}`);
    console.log(`With Hero Image: ${withHero}`);
    console.log(`Missing Images: ${total - withImages}`);
}

verify().catch(console.error).finally(() => process.exit(0));
