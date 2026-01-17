
# Firebase Setup Guide for Best of Goa

Follow these steps to configure your Firebase project.

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Name it `best-of-goa` (or similar).
4. Disable Google Analytics for now (simplifies setup), or enable if desired.
5. Click **"Create project"**.

## 2. Register Web App (Client SDK Config)
1. In the Project Overview, click the **Web icon (</>)**.
2. Register app nickname: `best-of-goa-web`.
3. **Copy the `firebaseConfig` object values**. You need these for `.env.local`:
   - `authDomain` -> `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` -> `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` -> `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` -> `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` -> `NEXT_PUBLIC_FIREBASE_APP_ID`

## 3. Enable Authentication
1. Go to **Build** > **Authentication**.
2. Click **"Get started"**.
3. **Sign-in method** tab:
   - Enable **Email/Password**.
   - Enable **Google**.

## 4. Enable Firestore Database
1. Go to **Build** > **Firestore Database**.
2. Click **"Create database"**.
3. Choose **asia-south1 (Mumbai)** as location (closest to Goa).
4. Select **"Start in Test mode"** (allows reads/writes for 30 days, easier for development).
5. Click **"Create"**.

## 5. Enable Storage
1. Go to **Build** > **Storage**.
2. Click **"Get started"**.
3. Start in **Test mode**.
4. Click **"Done"**.

## 6. Generate Service Account Key (Admin SDK)
1. Click the **Project Settings** (gear icon) > **Project settings**.
2. Go to **Service accounts** tab.
3. Click **"Generate new private key"**.
4. Click **"Generate key"** to download the JSON file.
5. Open the JSON file, copy the **entire content**.
6. **Important**: Collapse it into a single line (remove newlines) if possible, or just paste it carefully.
7. Paste it into `.env.local` as `FIREBASE_SERVICE_ACCOUNT_KEY`.

## 7. Update .env.local
Open your `.env.local` file and fill in all the values from above.
