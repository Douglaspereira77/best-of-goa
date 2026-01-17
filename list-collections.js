const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function list() {
    const collections = await db.listCollections();
    console.log('Collections:', collections.map(c => c.id).join(', '));

    for (const c of collections) {
        const snap = await c.limit(1).get();
        if (!snap.empty) {
            console.log(`${c.id} sample fields:`, Object.keys(snap.docs[0].data()));
        }
    }
}

list().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
