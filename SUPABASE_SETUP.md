# Shule Supabase Setup

Use this when moving Shule beyond demo JSON storage.

## 1. Create the tables

1. Open Supabase project: `https://supabase.com/dashboard/project/gswyvhxhawlcsfvcnfka`
2. Go to **SQL Editor**.
3. Open `supabase/schema.sql` from this repo.
4. Paste the full SQL into Supabase and run it.

The schema creates Shule tables for setup, students, marks, deadlines, uploads, promotions, audit logs, and report-ready school data.

## 2. Add Vercel environment variables

In Vercel project settings, add these Production environment variables:

```text
SUPABASE_URL=https://gswyvhxhawlcsfvcnfka.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-side-service-role-key
```

You may also use `SUPABASE_SECRET_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` if Supabase gives you the newer secret key format.

Do not put the service role or secret key in browser code, screenshots, GitHub, or chat.

## 3. Redeploy

Redeploy the Vercel project after saving the environment variables.

On first boot with Supabase variables present, Shule seeds Supabase from the MVP2 data model. After that, students, marks, deadlines, promotions, uploads, and audit entries persist in Supabase.

## 4. Verify

Open:

```text
https://shule-beta.vercel.app/api/bootstrap
```

Look for:

```json
"storageMode": "supabase"
```

If it says `"json"`, Vercel does not yet have the Supabase environment variables.

## 5. Repair an incomplete schema

If `/api/storage-status` shows a Supabase error like a missing table or missing column, run:

```text
supabase/repair-schema.sql
```

This is safe to rerun. It adds missing Shule tables, columns, indexes, and RLS settings without deleting data.
