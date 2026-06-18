# Shule Version 1.0 Deployment Checklist

## Supabase

- Create a dedicated Supabase project for the school.
- Run `supabase/schema.sql`.
- Run `supabase/repair-schema.sql` only when upgrading an older beta database.
- Run `supabase/production-hardening.sql`.
- Run `supabase/v1-commercial-release.sql`.
- Confirm anonymous users cannot select students, marks, teachers, assignments, deadlines, uploads, audit logs, or promotions.
- Confirm backups and point-in-time recovery appropriate to the school plan.

## Vercel

- Create a dedicated Vercel project for the school.
- Configure `SUPABASE_URL`.
- Configure `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`.
- Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase Auth.
- Configure `SHULE_SETUP_KEY` for first-admin creation, then rotate or remove it.
- Configure `SHULE_SUPER_ADMIN_EMAILS`.
- Configure `SHULE_TENANT_CODE`.
- Do not configure `SHULE_ALLOW_JSON_FALLBACK` in production.
- Redeploy after changing environment variables.

## School Setup

- Create the first Super Admin.
- Complete school profile, branding, contact details, subscription dates, and report prefix.
- Configure academic year, terms, exam types, classes, streams, subjects, grading, and promotion rules.
- Create staff accounts and teacher assignments.
- Import and validate the student register.
- Set marks deadlines.
- Test one full marks workflow from Draft to Locked.
- Generate, print, and verify one report.
- Test promotion preview, approval, and rollback before live promotion.

## UAT Sign-Off

- Student counts match the official register.
- Teacher assignment scopes are correct.
- Marks totals, averages, grades, aggregates, and positions have been independently checked.
- Report comments are learner-specific.
- A4 printing has been checked on the school's printer.
- Mobile screens have been checked on Android Chrome and iPhone Safari.
- Public verification exposes report data only.
- School Admin cannot create a Super Admin.
- Locked marks cannot be edited.
- Supabase failure produces an error and never switches to demo records.
