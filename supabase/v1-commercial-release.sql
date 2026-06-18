-- Shule Results Management System v1.0 commercial release migration
-- Run after schema.sql and production-hardening.sql.
-- This migration is additive and can be run more than once.

create table if not exists public.shule_subscriptions (
  id text primary key,
  tenant_code text not null,
  plan text not null default 'Starter',
  status text not null default 'Trial',
  trial_ends_at date,
  expires_at date,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists shule_subscriptions_tenant_idx
  on public.shule_subscriptions (tenant_code);

create table if not exists public.shule_assessment_workflows (
  id text primary key,
  academic_year text not null,
  term text not null,
  exam_type text not null,
  class_id text not null,
  subject_id text not null,
  teacher_id text,
  status text not null default 'Draft',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists shule_assessment_workflows_context_idx
  on public.shule_assessment_workflows
  (academic_year, term, exam_type, class_id, subject_id);

create table if not exists public.shule_student_documents (
  id text primary key,
  student_id text not null,
  document_type text not null,
  file_url text not null,
  file_name text,
  uploaded_by text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shule_student_documents_student_idx
  on public.shule_student_documents (student_id);

create table if not exists public.shule_report_archive (
  id text primary key,
  student_id text not null,
  academic_year text not null,
  term text not null,
  exam_type text not null,
  verification_code text not null,
  issued_at timestamptz not null default now(),
  issued_by text,
  data jsonb not null default '{}'::jsonb
);

drop index if exists public.shule_report_archive_verification_idx;

create index if not exists shule_report_archive_verification_idx
  on public.shule_report_archive (verification_code, issued_at desc);

create index if not exists shule_report_archive_student_idx
  on public.shule_report_archive (student_id, academic_year, term);

alter table public.shule_subscriptions enable row level security;
alter table public.shule_assessment_workflows enable row level security;
alter table public.shule_student_documents enable row level security;
alter table public.shule_report_archive enable row level security;

revoke all on table
  public.shule_subscriptions,
  public.shule_assessment_workflows,
  public.shule_student_documents,
  public.shule_report_archive
from anon;

create index if not exists shule_audit_logs_created_at_idx
  on public.shule_audit_logs (created_at desc);

create index if not exists shule_upload_batches_context_idx
  on public.shule_upload_batches (class_id, subject_id, status);

create index if not exists shule_deadlines_due_status_idx
  on public.shule_deadlines (due_at, status);

-- Private file storage foundation. The application stores learner photos as
-- storage:bucket/path references and serves them through signed server URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shule-private', 'shule-private', false, 12582912, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Tenant foundation for future shared SaaS. Current first-school deployments
-- use one Supabase project per school, but every school-owned table now carries
-- tenant_id so data can be migrated into a shared multi-tenant database later.
do $$
declare
  table_name text;
  school_tables text[] := array[
    'shule_school_profile',
    'shule_app_settings',
    'shule_academic_years',
    'shule_terms',
    'shule_exam_types',
    'shule_class_levels',
    'shule_streams',
    'shule_classes',
    'shule_subjects',
    'shule_teachers',
    'shule_teacher_assignments',
    'shule_grading_scale',
    'shule_roles',
    'shule_promotion_rules',
    'shule_promotion_history',
    'shule_students',
    'shule_marks',
    'shule_deadlines',
    'shule_upload_batches',
    'shule_upload_errors',
    'shule_audit_logs',
    'shule_subscriptions',
    'shule_assessment_workflows',
    'shule_student_documents',
    'shule_report_archive'
  ];
begin
  foreach table_name in array school_tables loop
    execute format('alter table public.%I add column if not exists tenant_id text not null default %L', table_name, 'main');
    execute format('create index if not exists %I on public.%I (tenant_id)', table_name || '_tenant_idx', table_name);
  end loop;
end $$;

-- Demo-mode read policies remain explicit and revocable. Production should use
-- server-side service-role access plus tenant-aware policies before shared SaaS.
do $$
declare
  table_name text;
  readable_tables text[] := array[
    'shule_school_profile',
    'shule_academic_years',
    'shule_terms',
    'shule_exam_types',
    'shule_class_levels',
    'shule_streams',
    'shule_classes',
    'shule_subjects',
    'shule_teachers',
    'shule_teacher_assignments',
    'shule_grading_scale',
    'shule_students',
    'shule_marks',
    'shule_report_archive'
  ];
begin
  foreach table_name in array readable_tables loop
    execute format('drop policy if exists %I on public.%I', 'demo_public_select_' || table_name, table_name);
    execute format('create policy %I on public.%I for select to anon using (true)', 'demo_public_select_' || table_name, table_name);
  end loop;
end $$;
