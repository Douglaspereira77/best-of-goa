const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function listNeighborhoods() {
    console.log('--- NEIGHBORHOODS ---');
    const snapshot = await db.collection('neighborhoods').get();
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}, Name: ${data.name}, Slug: ${data.slug}, District: ${data.district}`);
    });
}

listNeighborhoods().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
