# Shule Results Management System - Phase 2 Backlog

Source reviewed: `Shule Results Management System - Phase 2.pdf`

This backlog starts from the working MVP deployed at `https://shule-beta.vercel.app`.
Items already implemented are retained and are not scheduled for duplicate work.

## Status Legend

- **Done**: Working in the current MVP.
- **Partial**: A working foundation exists, but the full Phase 2 requirement is not complete.
- **Pending**: New Phase 2 work.

## Current MVP Baseline

| Capability | Status | Current implementation |
| --- | --- | --- |
| Supabase database connection | Done | Live connection diagnostics and nonzero database-backed dashboard data |
| Structured school setup | Done | Years, terms, exam types, classes, streams, subjects, teachers, assignments, grading and roles |
| Student register | Done | Detailed student fields, statuses, class/stream assignment and CSV class-list import |
| Student profile page | Done | Direct profile view with photo, admission, family, class, status, attendance and academic summary |
| Student photo capture | Partial | Compressed image upload works, but images are currently stored in the student record rather than Supabase Storage |
| Marks upload | Done | Context selection, template download, CSV upload, validation and downloadable errors |
| Upload monitoring and deadlines | Done | Expected, complete, pending, late, teacher and validation monitoring |
| Promotion | Partial | Preview, rules, approval and batch promotion history exist; learner movement history is not yet modeled separately |
| Report cards | Partial | Three-page reports, student/class printing, results, rankings, analytics, comments, grading matrix and signature spaces exist |
| Mobile experience | Done | Bottom navigation, More menu, stacked forms, mobile cards, fitted reports and responsive layouts |
| Analytics | Partial | Subject performance and core dashboard metrics exist; executive comparison and trend analysis remain |
| Audit trail | Done | Upload, setup, promotion, student and report-related activity foundations exist |

## Phase 2 Workstreams

### 2.1 Student Lifecycle and Movement

| Requirement | Status | Remaining work |
| --- | --- | --- |
| Alternative parent contact | Pending | Add field, validation, CSV support and profile display |
| Promotion history on profile | Partial | Promotion batches are stored; show each learner's entries on their profile |
| Movement history | Pending | Add movement records with from/to class and stream, type, date, approver and remarks |
| Learner journey | Pending | Display P1 through P7 timeline |
| Transfer, repeat, stream change and manual adjustment | Pending | Add controlled workflows and audit records |
| Attendance summary | Partial | Percentage exists; add days present, absent and total school days |
| Performance trend | Partial | Report trend is illustrative; calculate from stored assessments and terms |

### 2.2 Production Report Card

| Requirement | Status | Remaining work |
| --- | --- | --- |
| Official school logo | Partial | Logo URL works; move upload and management to Supabase Storage |
| Logo watermark | Pending | Replace text watermark with centered translucent official logo |
| Student passport photo | Partial | Photo renders; move asset storage to Supabase Storage |
| Real QR verification | Pending | Generate a real QR and add a public verification route |
| BOT, mid, end, final, grade and aggregate | Done | Present in the current report |
| Subject ranking | Pending | Calculate and display per-subject learner position |
| Teacher remarks | Partial | Grade comments exist; add assigned teacher remarks |
| Stream and class positions | Done | Calculated and displayed |
| Position by gender | Pending | Calculate within class/stream gender group |
| Attendance detail | Pending | Days present, absent and total school days plus chart |
| Conduct ratings | Partial | Competencies exist; add Respect and a polished visual rating |
| Four comment roles | Partial | Class teacher and head teacher exist; add subject teacher and DOS comments |
| Co-curricular details | Partial | Global activity list exists; make activities learner-specific |
| Next-term information | Pending | Opening/closing dates, fees balance, requirements and notes |
| Signatures and stamp | Partial | Print spaces exist; add managed digital signature and stamp assets |
| Analytics page | Partial | Current page has performance, trend, attendance and competencies; add radar and class distribution |
| Clean PDF export | Partial | A4 print layout exists, but mobile navigation, sheets and floating controls must be explicitly excluded |

### 2.3 Supabase Storage and Assets

Status: **Pending**

Create private or appropriately public buckets for:

- Student passport photos
- School logos
- School watermark assets
- Teacher, DOS and head teacher signatures
- School stamp

Store asset paths in database records instead of storing image data directly.

### 2.4 Executive Analytics

Status: **Partial**

Add:

- Total and active learners
- Average score
- Promotion rate
- Upload completion
- Subjects submitted
- Class comparison
- Subject performance
- Gender analysis
- Stream analysis
- Real term trends

Analytics must be calculated from Supabase records and support year, term, exam, class and stream filters.

### 2.5 Parent Portal

Status: **Pending**

Add secure parent access for:

- Viewing learner results
- Downloading report cards
- Attendance and conduct
- School notifications
- Verification and report history

This work requires authentication, parent-to-student relationships, access policies and a notification model.

### 2.6 Multi-School Branding

Status: **Partial**

The MVP supports configurable school identity and currently follows Makindye Junior Academy's maroon and gold branding. Phase 2 should make themes, logos, contact details, watermark and report assets configurable per school without hard-coded MJA values.

## Recommended Delivery Order

### Increment 1 - Data Foundation

1. Student movement history and learner journey
2. Detailed attendance records
3. Next-term settings and learner-specific activities/comments
4. Supabase Storage buckets and asset metadata

### Increment 2 - Official Reports

1. Storage-backed school logo, photos, signatures and stamp
2. Real QR generation and public verification page
3. Subject and gender ranking
4. Full attendance, conduct, comments and next-term sections
5. Dedicated clean A4 PDF export

### Increment 3 - Executive Analytics

1. Filterable class, stream, gender and subject comparisons
2. Real assessment and term trends
3. Promotion and submission analytics

### Increment 4 - Parent Portal

1. Authentication and role policies
2. Parent-student access mapping
3. Results, attendance, reports and notifications

### Increment 5 - Production Hardening

1. Role enforcement and Row Level Security
2. Backup, recovery and retention
3. Automated tests and deployment checks
4. Performance, accessibility and security review
5. Multi-school configuration

## Phase 2 Entry Rule

The current MVP remains the production baseline. Each increment should:

1. Use a separate feature branch.
2. Include backward-compatible database migrations.
3. Preserve existing student, marks and report data.
4. Pass desktop, mobile, print and Supabase verification.
5. Be deployed only after the current production workflow remains functional.
