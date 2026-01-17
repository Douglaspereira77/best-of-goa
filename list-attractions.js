const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function list() {
    console.log('Listing all collections and document counts...');
    const collections = await db.listCollections();

    if (collections.length === 0) {
        console.log('No collections found in this database.');
        return;
    }

    for (const collection of collections) {
        const countSnap = await db.collection(collection.id).count().get();
        console.log(`- ${collection.id}: ${countSnap.data().count} documents`);

        // Sample a few slugs if it's attractions
        if (collection.id === 'attractions') {
            const sample = await db.collection(collection.id).limit(10).get();
            sample.forEach(doc => {
                const d = doc.data();
                console.log(`  > Sample: ${d.name} (slug: ${d.slug}, active: ${d.active})`);
            });
        }
    }
}

list().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
