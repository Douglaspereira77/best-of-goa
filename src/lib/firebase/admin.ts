
import { initializeApp, getApps, getApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { logDebug } from '../debug-logger';

const APP_NAME = 'best-goa-admin';
let _app: any = null;

function getAdminApp() {
    if (_app) return _app;

    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    logDebug(`[FirebaseAdmin] Lazy Init. Key length: ${serviceAccountStr?.length}`);

    const apps = getApps();
    const existingApp = apps.find(a => a.name === APP_NAME);

    if (existingApp) {
        _app = existingApp;
        return _app;
    }

    if (serviceAccountStr) {
        try {
            const serviceAccount = JSON.parse(serviceAccountStr) as ServiceAccount;
            _app = initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            }, APP_NAME);
            logDebug('[FirebaseAdmin] App initialized NEW with Cert');
        } catch (error) {
            logDebug(`[FirebaseAdmin] Failed to parse service account key: ${error}`);
            _app = initializeApp({}, APP_NAME);
        }
    } else {
        _app = initializeApp({}, APP_NAME);
    }

    return _app;
}

export const adminDb = new Proxy({} as any, {
    get(target, prop) {
        const app = getAdminApp();
        const db = getFirestore(app);
        return (db as any)[prop];
    }
});

export const adminAuth = new Proxy({} as any, {
    get(target, prop) {
        const app = getAdminApp();
        const auth = getAuth(app);
        return (auth as any)[prop];
    }
});

export const adminStorage = new Proxy({} as any, {
    get(target, prop) {
        const app = getAdminApp();
        const storage = getStorage(app);
        return (storage as any)[prop];
    }
});
