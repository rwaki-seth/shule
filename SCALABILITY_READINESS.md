# Shule Pending Tasks and Scalability Readiness

Audit date: 18 June 2026

## Executive Decision

Shule is suitable for UAT and commercial pilots using one isolated deployment per school. This model is scalable operationally because every school receives its own Vercel project, Supabase project, environment variables, branding, backups, users, and domain.

Shule is not yet approved as a shared-database multi-school SaaS. The code has tenant metadata foundations, but academic tables do not yet enforce tenant isolation at the database row level.

## Pending Task Status

| Area | Status | Notes |
| --- | --- | --- |
| Professional UI/UX | Implemented | MJA branding, responsive mobile layout, loading states, password visibility toggle, dashboard refresh, student search, sortable student columns. |
| Dashboard | Implemented | School overview, academic overview, performance widgets, recent uploads, activity feed, and Supabase connection status are present. |
| Student management | Mostly implemented | Student CSV import, search, filters, profile view, photos, status, contact fields, and notes are present. Documents, medical, discipline, and attendance transaction screens remain future work. |
| Marks workflow | Implemented | Draft, Submitted, Approved, Locked workflow exists with role-based transitions and edit blocking after approval/lock. |
| CSV upload governance | Implemented | Marks and student uploads validate before saving; upload button is separate from file selection. |
| Monitoring | Implemented | Upload completion, pending, overdue, validation failures, teacher accountability, deadlines, and audit trail are present. |
| Promotion engine | Implemented | Per-class rules, mandatory subjects, ignore unassessed subjects, manual review, approval, and rollback are present. |
| Reports | Mostly implemented | Three-page A4 reports, individual and class printing, student-specific comments, QR verification, and public verification are present. Report archive persistence remains future work. |
| Public verification | Implemented | `/verify/{verificationCode}` works and exposes only report verification data. |
| Roles | Partially implemented | Super Admin, School Admin, Head Teacher, DOS, Class Teacher, Subject Teacher, Bursar, Parent, and Viewer foundations exist. Parent child-linking and fees sections remain future work. |
| Subscription management | Partially implemented | Plan/status/trial/expiry fields and access blocking are present. Automated billing is not implemented. |
| Security | Improved | Production fails closed without Supabase, public data APIs require auth, mutation origin checks, rate limiting, security headers, and role checks are present. Independent security review is still required before shared SaaS. |
| Multi-school SaaS | Not complete | Isolated per-school deployment is ready. Shared database tenancy requires tenant IDs on all school-owned records and RLS policies before use. |
| Performance/scalability | Partially implemented | Supabase-backed storage, dashboard summaries, indexes, and deployment runbooks are present. Pagination, archive tables, object storage, and automated tests remain required for larger schools. |

## Scalability Model Approved Now

Use this model for selling to schools immediately:

1. Create one Supabase project per school.
2. Create one Vercel project per school.
3. Configure the school code with `SHULE_TENANT_CODE`.
4. Run the schema, hardening, and commercial migration scripts.
5. Configure school branding and users.
6. Give the school a dedicated URL or custom domain.

This avoids cross-school data leakage and keeps each school independently maintainable.

## Shared SaaS Blockers

Before multiple schools share one Supabase database, complete these items:

1. Add `tenant_id` or `tenant_code` to every school-owned table.
2. Backfill tenant values for existing records.
3. Add foreign keys to a `schools` or `tenants` table.
4. Replace application-only tenant filtering with database-enforced RLS.
5. Ensure all API reads and writes include tenant scope.
6. Create automated tests proving School A cannot read, write, or infer School B data.
7. Move learner photos and documents to private object storage with signed URLs.
8. Add report archive persistence for every generated report.
9. Add pagination and server-side filtering for large registers and audit logs.
10. Add scheduled backups, restore drills, monitoring, and error alerts.

## Scalability Guardrails

- Do not enable `SHULE_ALLOW_JSON_FALLBACK` in production.
- Do not host multiple schools in one Supabase project yet.
- Do not store sensitive documents in public URLs.
- Do not allow parent accounts until secure child linking is implemented.
- Do not treat the service-role key as a browser variable.
- Do not skip UAT print checks; schools will judge the product heavily by printed reports.

## Recommended Next Sprint

1. Move assessment workflows into `shule_assessment_workflows`.
2. Persist generated reports in `shule_report_archive`.
3. Add private Supabase Storage buckets for photos and documents.
4. Add server-side pagination/search for students, marks, reports, and audit logs.
5. Build the tenant-isolation migration and RLS test suite.
6. Add automated browser checks for dashboard, student import, marks workflow, promotion, report print, and verification.

