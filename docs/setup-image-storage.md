# Image Storage Setup Instructions

## Step 1: Add Photos Column to Database

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/qcqxcffgfdsqfrwwvabh/editor
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy and paste the contents of `add-photos-column.sql`
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see: "SUCCESS: photos column added to restaurants table"

**Option B: Via psql or other SQL client**
```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.qcqxcffgfdsqfrwwvabh.supabase.co:5432/postgres" < add-photos-column.sql
```

## Step 2: Create Storage Bucket

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/qcqxcffgfdsqfrwwvabh/storage/buckets
2. Click "New bucket"
3. Configure:
   - **Name**: `restaurant-images`
   - **Public bucket**: âœ… YES (images need to be publicly accessible)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

4. Click "Create bucket"

5. Set up bucket policies (click on the bucket, then "Policies"):

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'restaurant-images' );
```

**Policy 2: Service Role Write Access**
```sql
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND auth.role() = 'service_role'
);
```

**Policy 3: Service Role Update Access**
```sql
CREATE POLICY "Service Role Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'restaurant-images'
  AND auth.role() = 'service_role'
);
```

**Policy 4: Service Role Delete Access**
```sql
CREATE POLICY "Service Role Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'restaurant-images'
  AND auth.role() = 'service_role'
);
```

## Step 3: Verify Setup

Run the verification script:
```bash
node verify-image-storage-setup.js
```

This will check:
- âœ… Photos column exists in restaurants table
- âœ… restaurant-images bucket exists and is publicly accessible
- âœ… Upload permissions work correctly

## Image URL Format

Once setup is complete, images will be accessible at:
```
https://qcqxcffgfdsqfrwwvabh.supabase.co/storage/v1/object/public/restaurant-images/{filename}
```

Example:
```
https://qcqxcffgfdsqfrwwvabh.supabase.co/storage/v1/object/public/restaurant-images/saffron-restaurant-salmiya-goa-biryani-platter-1.jpg
```
