import { adminDb } from '../src/lib/firebase/admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function dumpNeighborhoods() {
    if (!adminDb) {
        console.error('adminDb is null');
        return;
    }
    const snapshot = await adminDb.collection('neighborhoods').get();
    const data: any[] = [];
    snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
    });
    const dumpPath = fs.realpathSync('.') + '/neighborhoods_dump.json';
    fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2));
    console.log(`Dumped ${data.length} neighborhoods to ${dumpPath}`);
}

dumpNeighborhoods().catch(console.error);
