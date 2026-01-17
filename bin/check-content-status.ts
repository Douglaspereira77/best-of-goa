
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        process.exit(1);
    }
}

const db = admin.firestore();

async function main() {
    console.log('Checking AI Content Status...');

    try {
        const snapshot = await db.collection('restaurants').get();
        const total = snapshot.size;
        let populatedCount = 0;
        let missingCount = 0;
        // const missingExamples: string[] = []; // Original variable, no longer needed

        // console.log(`Total Restaurants Found: ${total}`); // Original intermediate log

        let miaGoaData: any = null;

        // Compact mode
        let missingList = [];
        for (const doc of snapshot.docs) {
            const data = doc.data() as any;
            if (data.description && data.description.length > 100) {
                populatedCount++;
            } else {
                missingCount++;
                missingList.push(data.name);
            }

            // Keep the Mia Goa specific check if it's not considered "intermediate" by the user's intent
            if (data.name === 'Mia Goa' || doc.id === 'mia-goa') {
                miaGoaData = { id: doc.id, ...data };
            }
        }

        // New compact logging for final stats
        console.log(`STATS: Total=${total} | Populated=${populatedCount} | Missing=${missingCount}`);
        if (missingList.length > 0) console.log('Missing: ' + missingList.slice(0, 5).join(', '));

        // The Mia Goa specific check was included in the provided edit snippet, so keeping it.
        if (miaGoaData) {
            console.log(`\nSpecific Check for 'Mia Goa' (${miaGoaData.id}):`);
            console.log(`- Description: ${miaGoaData.description ? miaGoaData.description.substring(0, 50) + '...' : 'MISSING'}`);
        }

        // (Logging handled above in compact mode)

    } catch (error) {
        console.error('Error querying Firestore:', error);
    }
}

main();
