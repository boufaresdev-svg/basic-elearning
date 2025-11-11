# 🚀 Supabase Setup Guide

## Why Supabase?

✅ **No CORS issues** - Works directly from frontend  
✅ **Simple setup** - No complex configuration  
✅ **Built-in storage** - For images/videos/PDFs  
✅ **Real-time** - Auto-sync across devices  
✅ **Free tier** - 500MB database + 1GB storage  

---

## Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com
2. Click **"Start your project"** → Sign up (free)
3. Click **"New project"**
4. Fill in:
   - **Name**: `elearning`
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
5. Click **"Create new project"** (wait 2 min)

---

## Step 2: Create Database Table

1. In your Supabase project, click **"Table Editor"**
2. Click **"Create a new table"**
3. Use this configuration:

**Table name**: `formations`

**Columns**:
- `id` - uuid - primary key - default: `gen_random_uuid()`
- `title` - text - required
- `category` - text - required
- `description` - text
- `objectives` - text
- `level` - text
- `image` - text
- `contents` - jsonb - default: `'[]'`
- `access_key` - text
- `created_at` - timestamptz - default: `now()`
- `updated_at` - timestamptz - default: `now()`
- `total_duration` - int4

4. Click **"Save"**

---

## Step 3: Enable Row Level Security (Optional)

For now, disable RLS to make it work immediately:

1. Go to **"Authentication"** → **"Policies"**
2. Find table `formations`
3. Click **"Disable RLS"** (for development)

**For production**, enable RLS and add policies!

---

## Step 4: Create Storage Bucket

1. Click **"Storage"** in sidebar
2. Click **"Create a new bucket"**
3. **Name**: `formations`
4. **Public**: ✅ Check this
5. Click **"Create bucket"**

---

## Step 5: Get Your Credentials

1. Click **"Settings"** → **"API"**
2. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 6: Update Service

Open `src/app/services/supabase.service.ts` and update:

```typescript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY_HERE';
```

---

## Step 7: Update Admin Dashboard

Replace `MongoDBService` with `SupabaseService` in:

`src/app/pages/admin/dashboard/admin-dashboard.component.ts`:

```typescript
import { SupabaseService } from '../../../services/supabase.service';

constructor(private supabaseService: SupabaseService) {
  // ... rest
}

// Replace all mongodbService calls with supabaseService
```

---

## Step 8: Test It!

```bash
npm start
```

1. Go to http://localhost:4200/admin
2. Login: admin / admin
3. Create a formation
4. Check Supabase dashboard → Table Editor → `formations`
5. You should see your data! ✅

---

## Supabase vs MongoDB

| Feature | Supabase | MongoDB Atlas |
|---------|----------|---------------|
| CORS | ✅ Works | ❌ Issues |
| Setup | 5 min | 30+ min |
| Storage | Built-in | Need Cloudinary |
| Real-time | ✅ Yes | ❌ No |
| Free tier | 500MB | 512MB |

---

## Next: File Upload with Supabase Storage

Update `file-upload.service.ts` to use Supabase Storage instead of Cloudinary:

```typescript
uploadVideo(file: File): Observable<string> {
  const path = `videos/${Date.now()}_${file.name}`;
  return this.supabaseService.uploadFile('formations', path, file);
}
```

**No more CORS issues! Everything works from frontend!** 🎉
