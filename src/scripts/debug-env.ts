
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env.local');

dotenv.config({ path: envPath });

console.log('Environment Keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('Program')));
