create function public.record_exact_document_duplicate(
  target_application_id uuid,
  attempted_filename text,
  content_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner_organization_id uuid;
  duplicate_run_id uuid := gen_random_uuid();
begin
  if auth.uid() is null
    or content_sha256 !~ '^[a-f0-9]{64}$'
    or char_length(trim(attempted_filename)) not between 1 and 180 then
    raise insufficient_privilege using message = 'Duplicate evidence could not be recorded.';
  end if;

  select a.owner_organization_id
  into target_owner_organization_id
  from public.applications a
  where a.id = target_application_id
    and a.status in ('draft', 'documents_uploaded')
    and public.has_organization_role(a.owner_organization_id, 'sme');

  if target_owner_organization_id is null then
    raise insufficient_privilege using message = 'Duplicate evidence could not be recorded.';
  end if;

  if not exists (
    select 1
    from public.documents d
    where d.owner_organization_id = target_owner_organization_id
      and d.sha256 = content_sha256
      and d.upload_completed_at is not null
  ) then
    raise check_violation using message = 'No same-organization duplicate exists.';
  end if;

  insert into public.verification_runs (
    id,
    application_id,
    initiated_by,
    status,
    started_at,
    completed_at
  ) values (
    duplicate_run_id,
    target_application_id,
    auth.uid(),
    'completed',
    now(),
    now()
  );

  insert into public.verification_checks (
    verification_run_id,
    application_id,
    rule_code,
    result,
    explanation,
    evidence
  ) values (
    duplicate_run_id,
    target_application_id,
    'V009',
    'fail',
    'This exact file is already stored in this SME workspace. Use the correct evidence for this slot.',
    jsonb_build_object(
      'attemptedFilename', trim(attempted_filename),
      'duplicateScope', 'same_organization'
    )
  );

  return duplicate_run_id;
end;
$$;

revoke all on function public.record_exact_document_duplicate(uuid, text, text) from public;
grant execute on function public.record_exact_document_duplicate(uuid, text, text) to authenticated;
