
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

console.log('Checking Apify Token...');
const token = process.env.APIFY_API_TOKEN;
if (!token) {
    console.log('FAIL: APIFY_API_TOKEN is missing in process.env');
} else {
    console.log(`Token present: ${token.substring(0, 5)}...`);

    // Try a simple fetch to verify validity
    fetch(`https://api.apify.com/v2/users/me?token=${token}`)
        .then(res => {
            console.log(`Auth Check Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.error) {
                console.log('Auth Check Error:', data.error.message);
            } else {
                console.log('Auth Check Success. User ID:', data.data?.id);
            }
        })
        .catch(err => console.error('Auth Check Failed:', err));
}
