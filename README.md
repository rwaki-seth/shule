# Shule Results Management System

Shule is a school results management system for learner registration, marks capture, approval, analytics, promotion, report cards, and public report verification.

## Version 1.0 Scope

Version 1.0 supports one school per isolated deployment:

- one Vercel project
- one Supabase project
- one school data set
- school-specific branding and users

This is the approved commercial deployment model until shared-database tenant isolation is completed.

## Main Capabilities

- Role-based staff access
- Student register, CSV import, profiles, and photos
- Class, stream, subject, teacher, and grading setup
- Marks CSV templates, validation, and uploads
- Draft, Submitted, Approved, and Locked assessment workflow
- Upload monitoring and audit activity
- Class, stream, learner, and subject analytics
- Configurable promotion rules, approval, and rollback
- Three-page printable report cards
- Public QR/report verification
- Subscription status and expiry enforcement

## Local Development

```powershell
npm install
npm start
```

Open `http://localhost:3000`.

Local JSON storage is allowed only for development. Set this explicitly when needed:

```powershell
$env:SHULE_ALLOW_JSON_FALLBACK = "true"
```

Production fails closed if Supabase is unavailable.

## Required Production Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SHULE_TENANT_CODE`

Never expose the service-role key in browser code.

## Release Documents

- [Commercial release audit](COMMERCIAL_RELEASE_AUDIT.md)
- [Pending tasks and scalability readiness](SCALABILITY_READINESS.md)
- [Release checklist](RELEASE_CHECKLIST.md)
- [Outstanding enhancements](OUTSTANDING_ENHANCEMENTS.md)
- [Deployment guide](DEPLOYMENT.md)
- [Commercial schema migration](supabase/v1-commercial-release.sql)
