# Shule Deployment Guide

## Recommended Commercial Model

Create an isolated deployment for each school. Each customer receives:

- a dedicated Supabase project
- a dedicated Vercel project
- a dedicated domain or subdomain
- independent users, branding, backups, and subscription settings

Do not place multiple schools in the same database until every school-owned table has an enforced `tenant_id` and tested Row Level Security policies.

## Supabase

1. Create a new Supabase project for the school.
2. Run the existing Shule schema and seed scripts.
3. Run `supabase/v1-commercial-release.sql`.
4. Confirm Row Level Security is enabled and anonymous public table access is revoked.
5. Retain public access only through the report verification API.

## Vercel Variables

Configure Production and Preview:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
SHULE_TENANT_CODE=<unique-school-code>
SUPABASE_STORAGE_BUCKET=shule-private
```

Do not configure `SHULE_ALLOW_JSON_FALLBACK` in Vercel. Production must fail visibly when the database cannot be reached.

## Deployment

The repository is connected to Vercel. A push to `main` creates the production deployment.

After deployment:

1. Open `/api/storage-status` while signed in as an administrator.
2. Confirm mode is `supabase` and `lastError` is empty.
3. Create the first Super Admin.
4. Configure the school profile and subscription dates.
5. Create staff accounts and assignments.
6. Import learners and test one assessment workflow.
7. Print a sample report and confirm it appears in the Report Archive.
8. Verify the archived report through `/verify/{verificationCode}`.

## Local School Deployment

For an offline-first school, run the Node server on a LAN computer with:

```powershell
$env:SHULE_ALLOW_JSON_FALLBACK = "true"
npm start
```

Back up `data/shule-db.json` daily. This mode is appropriate for local pilots, not internet-facing production.
