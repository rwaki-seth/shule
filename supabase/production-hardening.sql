-- Run after schema.sql or repair-schema.sql for a production school.
-- The application performs database access on the server with a secret/service key.
-- Anonymous browser users must not read learner, staff, mark, or audit tables directly.

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
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = v_table
        and policyname = policy_name
    ) then
      execute format('drop policy %I on public.%I', policy_name, v_table);
    end if;
  end loop;
end $$;

revoke all on table
  public.shule_students,
  public.shule_marks,
  public.shule_teachers,
  public.shule_teacher_assignments,
  public.shule_deadlines,
  public.shule_upload_batches,
  public.shule_upload_errors,
  public.shule_audit_logs,
  public.shule_promotion_rules,
  public.shule_promotion_history
from anon;

create index if not exists shule_students_class_status_idx
  on public.shule_students (class_id, status);

create index if not exists shule_marks_context_idx
  on public.shule_marks (academic_year, term, exam_type, class_id, subject_id);

create index if not exists shule_marks_student_idx
  on public.shule_marks (student_id);

create index if not exists shule_teacher_assignments_scope_idx
  on public.shule_teacher_assignments (teacher_id, class_id, subject_id);
