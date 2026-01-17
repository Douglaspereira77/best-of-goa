
import fs from 'fs';
import path from 'path';

export function logDebug(msg: string) {
    try {
        const logPath = path.join(process.cwd(), 'server-debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
        // Ignore logging errors
    }
}
