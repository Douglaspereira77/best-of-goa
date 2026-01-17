const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found');
    process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
    const collections = ['attractions', 'places_to_visit', 'attraction_categories', 'attraction_types'];
    for (const col of collections) {
        const snap = await db.collection(col).limit(1).get();
        console.log(`Collection '${col}': ${snap.empty ? 'Empty/Missing' : 'Has data'}`);
        if (!snap.empty) {
            console.log(`  Sample:`, docData(snap.docs[0].data()));
        }
    }
}

function docData(data) {
    return {
        name: data.name,
        slug: data.slug,
        id: data.id,
        active: data.active
    };
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
