alter table public.applications
add column normalized_invoice_number text;

update public.applications
set normalized_invoice_number = nullif(regexp_replace(upper(invoice_number), '[^A-Z0-9]', '', 'g'), '')
where invoice_number is not null;

drop index if exists public.applications_invoice_identity_key;

create unique index applications_supplier_invoice_identity_key
on public.applications (owner_organization_id, normalized_invoice_number)
where normalized_invoice_number is not null;

alter table public.verification_runs
add column rule_version text,
add column overall_result public.check_result;

create or replace function public.persist_verification_run_v1(
  target_application_id uuid,
  target_rule_version text,
  target_overall_result public.check_result,
  target_normalized_invoice_number text,
  checks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  run_id uuid := gen_random_uuid();
  expected_rules text[] := array['V001','V002','V003','V004','V005','V006','V007','V008','V009','V010','V011','V012'];
begin
  if auth.uid() is null or target_rule_version <> 'verification-v1'
    or target_normalized_invoice_number !~ '^[A-Z0-9]+$' then
    raise insufficient_privilege using message = 'Verification could not be saved.';
  end if;

  select * into target_application
  from public.applications
  where id = target_application_id
  for update;

  if target_application.id is null
    or target_application.status not in ('sme_reviewed', 'checks_complete')
    or not public.has_organization_role(target_application.owner_organization_id, 'sme') then
    raise insufficient_privilege using message = 'Verification could not be saved.';
  end if;

  if jsonb_typeof(checks) <> 'array'
    or jsonb_array_length(checks) <> 12
    or (select array_agg(item ->> 'ruleId' order by item ->> 'ruleId') from jsonb_array_elements(checks) item) <> expected_rules
    or exists (
      select 1 from jsonb_array_elements(checks) item
      where jsonb_typeof(item) <> 'object'
        or item ->> 'version' <> target_rule_version
        or item ->> 'status' not in ('pass','review','fail')
        or item ->> 'severity' not in ('info','warning','blocking')
        or char_length(trim(item ->> 'title')) not between 3 and 120
        or char_length(trim(item ->> 'explanation')) not between 3 and 500
        or jsonb_typeof(item -> 'comparedValues') <> 'object'
        or jsonb_typeof(item -> 'sourceDocumentIds') <> 'array'
    ) then
    raise check_violation using message = 'Verification result is incomplete.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(checks) item
    where (item ->> 'status')::public.check_result = 'fail'
  ) and target_overall_result <> 'fail' then
    raise check_violation using message = 'Verification summary is inconsistent.';
  elsif not exists (
    select 1 from jsonb_array_elements(checks) item
    where (item ->> 'status')::public.check_result = 'fail'
  ) and exists (
    select 1 from jsonb_array_elements(checks) item
    where (item ->> 'status')::public.check_result = 'review'
  ) and target_overall_result <> 'review' then
    raise check_violation using message = 'Verification summary is inconsistent.';
  elsif not exists (
    select 1 from jsonb_array_elements(checks) item
    where item ->> 'status' in ('fail','review')
  ) and target_overall_result <> 'pass' then
    raise check_violation using message = 'Verification summary is inconsistent.';
  end if;

  if (select count(*) from public.documents d where d.application_id = target_application.id and d.extraction_status = 'reviewed') <> 3
    or (select count(*) from public.document_fields f join public.documents d on d.id = f.document_id where d.application_id = target_application.id and f.review_status <> 'unreviewed') <> 21 then
    raise check_violation using message = 'Human review is incomplete.';
  end if;

  if exists (
    select 1 from public.applications other
    where other.owner_organization_id = target_application.owner_organization_id
      and other.id <> target_application.id
      and coalesce(other.normalized_invoice_number, nullif(regexp_replace(upper(other.invoice_number), '[^A-Z0-9]', '', 'g'), '')) = target_normalized_invoice_number
  ) then
    if not exists (select 1 from jsonb_array_elements(checks) item where item ->> 'ruleId' = 'V010' and item ->> 'status' = 'fail') then
      raise check_violation using message = 'Duplicate invoice result is inconsistent.';
    end if;
  else
    if not exists (select 1 from jsonb_array_elements(checks) item where item ->> 'ruleId' = 'V010' and item ->> 'status' = 'pass') then
      raise check_violation using message = 'Invoice identity result is inconsistent.';
    end if;
    update public.applications set normalized_invoice_number = target_normalized_invoice_number where id = target_application.id;
  end if;

  insert into public.verification_runs (
    id, application_id, initiated_by, status, started_at, completed_at, rule_version, overall_result
  ) values (
    run_id, target_application.id, auth.uid(), 'completed', now(), now(), target_rule_version, target_overall_result
  );

  insert into public.verification_checks (
    verification_run_id, application_id, rule_code, result, explanation, evidence
  )
  select run_id, target_application.id, item ->> 'ruleId', (item ->> 'status')::public.check_result,
    item ->> 'explanation', item
  from jsonb_array_elements(checks) item;

  update public.applications
  set status = 'checks_complete'
  where id = target_application.id and status = 'sme_reviewed';

  insert into public.audit_events (
    organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata
  ) values (
    target_application.owner_organization_id, target_application.id, auth.uid(),
    'application.verification_completed', 'verification_run', run_id,
    jsonb_build_object('ruleVersion', target_rule_version, 'overallResult', target_overall_result, 'checkCount', 12)
  );

  return run_id;
end;
$$;

revoke all on function public.persist_verification_run_v1(uuid, text, public.check_result, text, jsonb) from public, anon;
grant execute on function public.persist_verification_run_v1(uuid, text, public.check_result, text, jsonb) to authenticated;

create or replace function public.send_application_to_buyer(target_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  confirmation_id uuid;
  latest_result public.check_result;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'The request could not be sent.';
  end if;

  select * into target_application
  from public.applications
  where id = target_application_id
  for update;

  if target_application.id is null
    or target_application.status not in ('checks_complete', 'buyer_pending')
    or not public.has_organization_role(target_application.owner_organization_id, 'sme') then
    raise insufficient_privilege using message = 'The request could not be sent.';
  end if;

  select vr.overall_result into latest_result
  from public.verification_runs vr
  where vr.application_id = target_application.id and vr.status = 'completed' and vr.rule_version = 'verification-v1'
  order by vr.completed_at desc, vr.created_at desc
  limit 1;

  if latest_result is null or latest_result = 'fail' then
    raise check_violation using message = 'Resolve failed checks before requesting buyer confirmation.';
  end if;

  insert into public.confirmations (application_id, buyer_organization_id)
  values (target_application.id, target_application.buyer_organization_id)
  on conflict (application_id) do nothing
  returning id into confirmation_id;

  if confirmation_id is null then
    select id into confirmation_id from public.confirmations where application_id = target_application.id;
  end if;

  if target_application.status = 'checks_complete' then
    update public.applications
    set status = 'buyer_pending', submitted_at = coalesce(submitted_at, now())
    where id = target_application.id;

    insert into public.audit_events (
      organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata
    ) values (
      target_application.owner_organization_id, target_application.id, auth.uid(),
      'application.sent_to_buyer', 'confirmation', confirmation_id,
      jsonb_build_object('buyerOrganizationId', target_application.buyer_organization_id)
    );
  end if;

  return confirmation_id;
end;
$$;

revoke all on function public.send_application_to_buyer(uuid) from public, anon;
grant execute on function public.send_application_to_buyer(uuid) to authenticated;
