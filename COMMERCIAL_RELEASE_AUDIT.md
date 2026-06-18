# Shule Version 1.0 Commercial Release Audit

Audit date: 12 June 2026

## Release Position

Shule is ready for controlled school UAT as an isolated single-school deployment. Each commercial school should receive its own Vercel project, Supabase project, environment variables, branding, users, and domain.

A shared-database multi-tenant SaaS rollout is not yet approved. Tenant identity is present in user and school metadata, but all academic tables must be converted to enforced `tenant_id` foreign keys and tenant-filtered queries before multiple schools share one Supabase project.

## Resolved Critical Issues

### Data Safety

- Production storage now fails closed when Supabase is missing or unavailable.
- Temporary JSON fallback is only available locally or when `SHULE_ALLOW_JSON_FALLBACK=true` is explicitly configured.
- Production no longer reseeds an empty or incompatible database automatically.
- Database version mismatch now produces a migration error instead of replacing school data.

### Security

- Added same-origin mutation checks.
- Added rate limits for login, first-admin setup, and public report verification.
- Added CSP, frame protection, content-type protection, referrer policy, and browser permissions policy.
- Supabase service access remains server-side.
- School Admin can manage users in their own school but cannot create Super Admin accounts.
- Bursar and Parent roles are included as controlled role foundations.
- Subscription status can block non-Super-Admin access after suspension or expiry.

### Marks Governance

- Added Draft, Submitted, Approved, and Locked assessment states.
- Teachers can submit completed class-subject assessments.
- DOS can approve submitted marks.
- Head Teacher can lock approved marks.
- School Admin can reopen an assessment when correction is authorized.
- Approved and locked marks cannot be edited.
- Workflow transitions and mark edits are included in the audit trail.

### Promotion

- Promotion now considers subjects assessed for the learner's class.
- Subjects with no class assessment are ignored unless configured as mandatory.
- Per-class rules support minimum average, maximum failed subjects, mandatory subjects, and complete-mark requirements.
- Added focused manual-review reasons and decisions.
- Added promotion approval rollback with learner and movement restoration.

### Reporting and Verification

- Report cards remain three pages with A4 print rules.
- QR codes now target `/verify/{verificationCode}`.
- Verification shows the Shule verification statement and report issue/check date.
- Invalid report codes return a report-not-found state.

### Product Experience

- Dashboard now includes school, academic, performance, upload, and activity summaries.
- Added responsive loading skeletons and reduced-motion support.
- Student search, profile access, class filters, stream filters, and sortable columns remain available.
- Mobile uses dedicated navigation, stacked forms, mobile record cards, and responsive report preview.

## Existing Strengths Confirmed

- Structured academic setup
- Student CSV preview and controlled upload
- Multi-class marks CSV upload for administrators
- Teacher assignment validation
- Upload monitoring and deadlines
- Individual learner remarks
- Class and subject analytics
- Student profiles and movement history
- Role-scoped teacher data
- Public report verification without administration access
- Supabase RLS enabled with anonymous learner data revoked

## High-Priority Items Remaining

1. Convert all tables and API queries to enforced `tenant_id` isolation before shared-database SaaS.
2. Move photos and documents from base64/URL fields to private Supabase Storage buckets with signed URLs.
3. Persist assessment workflows in `shule_assessment_workflows`; Version 1.0 currently stores them inside application metadata for compatibility.
4. Archive every issued report in `shule_report_archive`.
5. Add document, discipline, medical, and attendance transaction screens.
6. Add secure parent-to-child account linking.
7. Add automated test coverage and CI browser matrix for Chrome, Edge, and Firefox.
8. Add payment-provider integration and automated subscription billing.
9. Add backup, restore, retention, and disaster-recovery procedures.
10. Complete an independent security review before hosting multiple schools in one environment.

## Commercial Deployment Decision

Approved for:

- Internal UAT
- Pilot deployment
- One school per isolated Vercel and Supabase environment
- Custom school domain and branding

Not approved for:

- Multiple schools sharing one Supabase database
- Storing sensitive medical or disciplinary documents without private object storage
- Automated billing without a payment integration
