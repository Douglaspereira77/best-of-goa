
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function main() {
    const slug = 'ritz-classic-panjim-panjim';
    const doc = await db.collection('restaurants').doc(slug).get();

    if (!doc.exists) {
        console.log('Restaurant not found');
        return;
    }

    const data = doc.data();
    console.log('Name:', data?.name);
    console.log('Description Base:', data?.description ? 'Present' : 'Missing');
    if (data?.description) console.log('Description Preview:', data.description.substring(0, 100) + '...');

    console.log('SEO Metadata:', data?.seo_metadata ? 'Present' : 'Missing');
    console.log('FAQs:', data?.faqs?.length || 0);
    console.log('Dishes:', data?.dishes?.length || 0);
}

main();
