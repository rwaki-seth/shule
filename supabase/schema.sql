-- Shule MVP2 Supabase schema
-- Run this once in Supabase Dashboard > SQL Editor.
-- The app uses server-side Supabase REST calls. Keep your secret/service key only in Vercel env vars.

create table if not exists public.shule_app_settings (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_school_profile (
  id text primary key default 'main',
  name text,
  short_name text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_academic_years (
  id text primary key,
  name text not null,
  active boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_terms (
  id text primary key,
  name text not null,
  academic_year_id text,
  active boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_exam_types (
  id text primary key,
  name text not null,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_class_levels (
  id text primary key,
  name text not null,
  sort_order integer,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_streams (
  id text primary key,
  name text not null,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_classes (
  id text primary key,
  level text,
  stream text,
  name text not null,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_subjects (
  id text primary key,
  code text,
  name text not null,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_teachers (
  id text primary key,
  name text not null,
  role text,
  email text,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_teacher_assignments (
  id text primary key,
  teacher_id text,
  class_id text,
  subject_id text,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_grading_scale (
  id text primary key,
  grade text not null,
  min_score numeric,
  max_score numeric,
  aggregate integer,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_roles (
  id text primary key,
  name text not null,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_promotion_rules (
  id text primary key,
  academic_year text,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_students (
  id text primary key,
  student_id text,
  admission_no text unique,
  full_name text not null,
  class_id text,
  stream text,
  status text,
  parent_contact text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists shule_students_class_idx on public.shule_students (class_id);
create index if not exists shule_students_status_idx on public.shule_students (status);

create table if not exists public.shule_marks (
  id text primary key,
  student_id text,
  subject_id text,
  class_id text,
  academic_year text,
  term text,
  exam_type text,
  teacher_id text,
  score numeric,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists shule_marks_context_idx on public.shule_marks (academic_year, term, exam_type, class_id, subject_id);
create index if not exists shule_marks_student_idx on public.shule_marks (student_id);

create table if not exists public.shule_deadlines (
  id text primary key,
  academic_year text,
  term text,
  exam_type text,
  class_id text,
  subject_id text,
  teacher_id text,
  due_at timestamptz,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_upload_batches (
  id text primary key,
  teacher_id text,
  class_id text,
  subject_id text,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_upload_errors (
  id text primary key,
  batch_id text,
  row_number text,
  admission_no text,
  error_type text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shule_audit_logs (
  id text primary key,
  actor text,
  action text,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.shule_promotion_history (
  id text primary key,
  academic_year text,
  approved_by text,
  approved_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shule_app_settings enable row level security;
alter table public.shule_school_profile enable row level security;
alter table public.shule_academic_years enable row level security;
alter table public.shule_terms enable row level security;
alter table public.shule_exam_types enable row level security;
alter table public.shule_class_levels enable row level security;
alter table public.shule_streams enable row level security;
alter table public.shule_classes enable row level security;
alter table public.shule_subjects enable row level security;
alter table public.shule_teachers enable row level security;
alter table public.shule_teacher_assignments enable row level security;
alter table public.shule_grading_scale enable row level security;
alter table public.shule_roles enable row level security;
alter table public.shule_promotion_rules enable row level security;
alter table public.shule_students enable row level security;
alter table public.shule_marks enable row level security;
alter table public.shule_deadlines enable row level security;
alter table public.shule_upload_batches enable row level security;
alter table public.shule_upload_errors enable row level security;
alter table public.shule_audit_logs enable row level security;
alter table public.shule_promotion_history enable row level security;
