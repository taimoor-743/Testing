# Complete Database Save Fix

## Problem
The error "there is no unique or exclusion constraint matching the ON CONFLICT specification" occurs because the `google_drive_connections` table lacks the necessary unique constraints for upsert operations.

## Root Cause
1. The `google_drive_connections` table has no unique constraints
2. The code was trying to use `ON CONFLICT` operations without proper constraints
3. This caused the `db_save_failed` error during Google Drive connection

## Solution

### Step 1: Add Database Constraints
Run the SQL script `FIX_DATABASE_CONSTRAINTS.sql` in your Supabase SQL editor:

```sql
-- Add unique constraint on google_email in google_drive_connections table
ALTER TABLE google_drive_connections 
ADD CONSTRAINT google_drive_connections_google_email_unique 
UNIQUE (google_email);

-- Add unique constraint on user_id in google_drive_connections table  
ALTER TABLE google_drive_connections 
ADD CONSTRAINT google_drive_connections_user_id_unique 
UNIQUE (user_id);
```

### Step 2: Updated Code
The `lib/supabase.ts` file has been updated to:
1. Use `upsert()` instead of `insert()` with `ON CONFLICT`
2. Properly handle existing connections by updating them
3. Use the `google_email` unique constraint for conflict resolution

### Step 3: Key Changes Made

#### Before (Problematic):
```typescript
// Delete existing connection first
await supabase.from('google_drive_connections').delete().eq('user_id', user.id)

// Then insert new connection
await supabase.from('google_drive_connections').insert(connectionData)
```

#### After (Fixed):
```typescript
// Use upsert with proper conflict resolution
await supabase.from('google_drive_connections').upsert(connectionData, {
  onConflict: 'google_email', // Use unique constraint
  ignoreDuplicates: false // Update existing records
})
```

## Benefits
1. **Eliminates `db_save_failed` error**: Proper upsert operations
2. **Handles duplicate connections**: Updates existing instead of failing
3. **Stores client_id and client_secret**: All OAuth credentials preserved
4. **Better error handling**: Specific error messages for different constraint violations

## Testing
After applying the database constraints, test the Google Drive connection:
1. Go to `/test-google-drive` page
2. Click "Test Google Drive OAuth"
3. Complete the OAuth flow
4. Verify no `db_save_failed` error occurs
5. Check that client_id and client_secret are stored in database

## Files Modified
- `lib/supabase.ts` - Updated `saveGoogleDriveConnection` method
- `FIX_DATABASE_CONSTRAINTS.sql` - Database schema fix
- `COMPLETE_DB_SAVE_FIX.md` - This documentation

## Next Steps
1. Run the SQL script in Supabase
2. Deploy the updated code
3. Test the Google Drive connection
4. Verify the fix resolves the `db_save_failed` error
