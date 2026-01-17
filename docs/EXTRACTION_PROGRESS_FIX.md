# Extraction Progress Display Fix

## Issue
The re-extraction review page was not showing the "Extraction Progress" section even though the progress was being polled and tracked.

## Root Cause
The extraction status API returns `status: 'in_progress'` but the review page was only checking for `status === 'processing'`, so `extractionProgress.isRunning` was never set to `true`.

## Fix Applied
Updated `src/app/admin/restaurants/[id]/review/page.tsx` to check for both status values:
```typescript
const isRunning = statusData.status === 'in_progress' || statusData.status === 'processing';
```

## Result
The extraction progress section will now properly display when:
- Status is `'in_progress'` or `'processing'`
- Shows current step name
- Shows progress percentage
- Shows spinning animation
- Automatically hides when extraction completes or fails

## Testing
1. Go to any restaurant review page
2. Click "Re-run Extraction"
3. The "Re-extraction Progress" section should now appear in the sidebar
4. Progress bar and step name should update in real-time
5. Page should auto-reload when extraction completes

