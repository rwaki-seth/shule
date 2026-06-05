-- Shule Supabase schema repair
-- Run this if /api/storage-status reports a missing Shule table or column.
-- It is safe to rerun. It only creates missing tables/columns and indexes.

create table if not exists public.shule_app_settings ();
alter table public.shule_app_settings add column if not exists key text;
alter table public.shule_app_settings add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_app_settings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_school_profile ();
alter table public.shule_school_profile add column if not exists id text default 'main';
alter table public.shule_school_profile add column if not exists name text;
alter table public.shule_school_profile add column if not exists short_name text;
alter table public.shule_school_profile add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_school_profile add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_academic_years ();
alter table public.shule_academic_years add column if not exists id text;
alter table public.shule_academic_years add column if not exists name text;
alter table public.shule_academic_years add column if not exists active boolean not null default false;
alter table public.shule_academic_years add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_academic_years add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_terms ();
alter table public.shule_terms add column if not exists id text;
alter table public.shule_terms add column if not exists name text;
alter table public.shule_terms add column if not exists academic_year_id text;
alter table public.shule_terms add column if not exists active boolean not null default false;
alter table public.shule_terms add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_terms add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_exam_types ();
alter table public.shule_exam_types add column if not exists id text;
alter table public.shule_exam_types add column if not exists name text;
alter table public.shule_exam_types add column if not exists active boolean not null default true;
alter table public.shule_exam_types add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_exam_types add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_class_levels ();
alter table public.shule_class_levels add column if not exists id text;
alter table public.shule_class_levels add column if not exists name text;
alter table public.shule_class_levels add column if not exists sort_order integer;
alter table public.shule_class_levels add column if not exists active boolean not null default true;
alter table public.shule_class_levels add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_class_levels add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_streams ();
alter table public.shule_streams add column if not exists id text;
alter table public.shule_streams add column if not exists name text;
alter table public.shule_streams add column if not exists active boolean not null default true;
alter table public.shule_streams add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_streams add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_classes ();
alter table public.shule_classes add column if not exists id text;
alter table public.shule_classes add column if not exists level text;
alter table public.shule_classes add column if not exists stream text;
alter table public.shule_classes add column if not exists name text;
alter table public.shule_classes add column if not exists active boolean not null default true;
alter table public.shule_classes add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_classes add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_subjects ();
alter table public.shule_subjects add column if not exists id text;
alter table public.shule_subjects add column if not exists code text;
alter table public.shule_subjects add column if not exists name text;
alter table public.shule_subjects add column if not exists active boolean not null default true;
alter table public.shule_subjects add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_subjects add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_teachers ();
alter table public.shule_teachers add column if not exists id text;
alter table public.shule_teachers add column if not exists name text;
alter table public.shule_teachers add column if not exists role text;
alter table public.shule_teachers add column if not exists email text;
alter table public.shule_teachers add column if not exists active boolean not null default true;
alter table public.shule_teachers add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_teachers add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_teacher_assignments ();
alter table public.shule_teacher_assignments add column if not exists id text;
alter table public.shule_teacher_assignments add column if not exists teacher_id text;
alter table public.shule_teacher_assignments add column if not exists class_id text;
alter table public.shule_teacher_assignments add column if not exists subject_id text;
alter table public.shule_teacher_assignments add column if not exists active boolean not null default true;
alter table public.shule_teacher_assignments add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_teacher_assignments add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_grading_scale ();
alter table public.shule_grading_scale add column if not exists id text;
alter table public.shule_grading_scale add column if not exists grade text;
alter table public.shule_grading_scale add column if not exists min_score numeric;
alter table public.shule_grading_scale add column if not exists max_score numeric;
alter table public.shule_grading_scale add column if not exists aggregate integer;
alter table public.shule_grading_scale add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_grading_scale add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_roles ();
alter table public.shule_roles add column if not exists id text;
alter table public.shule_roles add column if not exists name text;
alter table public.shule_roles add column if not exists active boolean not null default true;
alter table public.shule_roles add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_roles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_promotion_rules ();
alter table public.shule_promotion_rules add column if not exists id text;
alter table public.shule_promotion_rules add column if not exists academic_year text;
alter table public.shule_promotion_rules add column if not exists status text;
alter table public.shule_promotion_rules add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_promotion_rules add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_students ();
alter table public.shule_students add column if not exists id text;
alter table public.shule_students add column if not exists student_id text;
alter table public.shule_students add column if not exists admission_no text;
alter table public.shule_students add column if not exists full_name text;
alter table public.shule_students add column if not exists class_id text;
alter table public.shule_students add column if not exists stream text;
alter table public.shule_students add column if not exists status text;
alter table public.shule_students add column if not exists parent_contact text;
alter table public.shule_students add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_students add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_marks ();
alter table public.shule_marks add column if not exists id text;
alter table public.shule_marks add column if not exists student_id text;
alter table public.shule_marks add column if not exists subject_id text;
alter table public.shule_marks add column if not exists class_id text;
alter table public.shule_marks add column if not exists academic_year text;
alter table public.shule_marks add column if not exists term text;
alter table public.shule_marks add column if not exists exam_type text;
alter table public.shule_marks add column if not exists teacher_id text;
alter table public.shule_marks add column if not exists score numeric;
alter table public.shule_marks add column if not exists status text;
alter table public.shule_marks add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_marks add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_deadlines ();
alter table public.shule_deadlines add column if not exists id text;
alter table public.shule_deadlines add column if not exists academic_year text;
alter table public.shule_deadlines add column if not exists term text;
alter table public.shule_deadlines add column if not exists exam_type text;
alter table public.shule_deadlines add column if not exists class_id text;
alter table public.shule_deadlines add column if not exists subject_id text;
alter table public.shule_deadlines add column if not exists teacher_id text;
alter table public.shule_deadlines add column if not exists due_at timestamptz;
alter table public.shule_deadlines add column if not exists status text;
alter table public.shule_deadlines add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_deadlines add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_upload_batches ();
alter table public.shule_upload_batches add column if not exists id text;
alter table public.shule_upload_batches add column if not exists teacher_id text;
alter table public.shule_upload_batches add column if not exists class_id text;
alter table public.shule_upload_batches add column if not exists subject_id text;
alter table public.shule_upload_batches add column if not exists status text;
alter table public.shule_upload_batches add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_upload_batches add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_upload_errors ();
alter table public.shule_upload_errors add column if not exists id text;
alter table public.shule_upload_errors add column if not exists batch_id text;
alter table public.shule_upload_errors add column if not exists row_number text;
alter table public.shule_upload_errors add column if not exists admission_no text;
alter table public.shule_upload_errors add column if not exists error_type text;
alter table public.shule_upload_errors add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_upload_errors add column if not exists updated_at timestamptz not null default now();

create table if not exists public.shule_audit_logs ();
alter table public.shule_audit_logs add column if not exists id text;
alter table public.shule_audit_logs add column if not exists actor text;
alter table public.shule_audit_logs add column if not exists action text;
alter table public.shule_audit_logs add column if not exists created_at timestamptz not null default now();
alter table public.shule_audit_logs add column if not exists data jsonb not null default '{}'::jsonb;

create table if not exists public.shule_promotion_history ();
alter table public.shule_promotion_history add column if not exists id text;
alter table public.shule_promotion_history add column if not exists academic_year text;
alter table public.shule_promotion_history add column if not exists approved_by text;
alter table public.shule_promotion_history add column if not exists approved_at timestamptz;
alter table public.shule_promotion_history add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.shule_promotion_history add column if not exists updated_at timestamptz not null default now();

create index if not exists shule_students_class_idx on public.shule_students (class_id);
create index if not exists shule_students_status_idx on public.shule_students (status);
create index if not exists shule_marks_context_idx on public.shule_marks (academic_year, term, exam_type, class_id, subject_id);
create index if not exists shule_marks_student_idx on public.shule_marks (student_id);

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

do $$
declare
  v_table text;
  policy_name text;
begin
  foreach v_table in array array[
    'shule_school_profile',
    'shule_academic_years',
    'shule_terms',
    'shule_class_levels',
    'shule_classes',
    'shule_streams',
    'shule_students',
    'shule_subjects',
    'shule_teachers',
    'shule_grading_scale',
    'shule_exam_types',
    'shule_marks'
  ] loop
    policy_name := 'demo_public_read_' || v_table;
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = v_table
    ) and not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = v_table
        and policyname = policy_name
    ) then
      execute format('create policy %I on public.%I for select to anon, authenticated using (true)', policy_name, v_table);
    end if;
  end loop;
end $$;
