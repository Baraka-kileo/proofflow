alter table public.confirmations
add column answers jsonb,
add column answer_explanations jsonb,
add column transaction_snapshot jsonb,
add column declaration_version text,
add column representative_name text,
add column representative_job_title text,
add column representative_company text,
add column representative_email text,
add column signature_strokes jsonb,
add column approval_id uuid unique,
add column decision_payload_hash text;

alter table public.confirmations
add constraint confirmations_approval_shape check (
  (status = 'pending' and approval_id is null and answers is null)
  or (status = 'disputed' and approval_id is null and answers is not null and signature_strokes is null)
  or (
    status = 'confirmed'
    and approval_id is not null
    and answers is not null
    and declaration_version is not null
    and representative_name is not null
    and representative_job_title is not null
    and representative_company is not null
    and representative_email is not null
    and signature_strokes is not null
  )
) not valid;

drop policy if exists "addressed buyer decides pending confirmation" on public.confirmations;

create or replace function public.submit_buyer_confirmation_v1(
  target_confirmation_id uuid,
  submitted_answers jsonb,
  submitted_explanations jsonb,
  submitted_job_title text default null,
  submitted_declaration_version text default null,
  submitted_signature_strokes jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmation_row public.confirmations%rowtype;
  application_row public.applications%rowtype;
  profile_name text;
  organization_name text;
  corporate_email text;
  email_confirmed_at timestamptz;
  has_negative boolean;
  payload_hash text;
  approval uuid;
  decision_time timestamptz := now();
  snapshot jsonb;
  latest_run public.verification_runs%rowtype;
  next_run_id uuid;
  next_overall public.check_result;
  v012_result public.check_result;
  negative_reason text;
  required_keys text[] := array['poIssued','deliveryAccepted','invoiceRecognized','amountCorrect','invoiceOutstanding','paymentDateCorrect'];
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'The buyer decision could not be saved.';
  end if;

  if jsonb_typeof(submitted_answers) <> 'object'
    or (select array_agg(key order by key) from jsonb_object_keys(submitted_answers) key)
      <> (select array_agg(key order by key) from unnest(required_keys) key)
    or exists (
      select 1 from jsonb_each(submitted_answers) item
      where jsonb_typeof(item.value) <> 'boolean'
    )
    or jsonb_typeof(coalesce(submitted_explanations, '{}'::jsonb)) <> 'object'
    or exists (
      select 1 from jsonb_object_keys(coalesce(submitted_explanations, '{}'::jsonb)) key
      where not key = any(required_keys)
    ) then
    raise check_violation using message = 'Answer all six confirmation questions.';
  end if;

  has_negative := exists (select 1 from jsonb_each(submitted_answers) item where item.value = 'false'::jsonb);

  if exists (
    select 1 from unnest(required_keys) key
    where submitted_answers -> key = 'false'::jsonb
      and char_length(trim(coalesce(submitted_explanations ->> key, ''))) not between 3 and 300
  ) or exists (
    select 1 from jsonb_each_text(coalesce(submitted_explanations, '{}'::jsonb)) item
    where char_length(trim(item.value)) > 300
  ) then
    raise check_violation using message = 'Explain each No answer in 3 to 300 characters.';
  end if;

  if has_negative then
    if submitted_job_title is not null or submitted_declaration_version is not null or submitted_signature_strokes is not null then
      raise check_violation using message = 'A disputed confirmation cannot include a signature.';
    end if;
  elsif char_length(trim(coalesce(submitted_job_title, ''))) not between 2 and 100
    or submitted_declaration_version <> 'buyer-declaration-v1'
    or jsonb_typeof(submitted_signature_strokes) <> 'array'
    or jsonb_array_length(submitted_signature_strokes) not between 1 and 24
    or octet_length(submitted_signature_strokes::text) > 80000
    or exists (
      select 1 from jsonb_array_elements(submitted_signature_strokes) stroke
      where jsonb_typeof(stroke) <> 'array'
        or jsonb_array_length(stroke) not between 2 and 300
        or exists (
          select 1 from jsonb_array_elements(stroke) point
          where jsonb_typeof(point) <> 'object'
            or jsonb_typeof(point -> 'x') <> 'number'
            or jsonb_typeof(point -> 'y') <> 'number'
            or (point ->> 'x')::numeric not between 0 and 1
            or (point ->> 'y')::numeric not between 0 and 1
        )
    ) then
    raise check_violation using message = 'Complete the declaration, job title, and handwritten signature.';
  end if;

  payload_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'answers', submitted_answers,
    'explanations', coalesce(submitted_explanations, '{}'::jsonb),
    'jobTitle', nullif(trim(submitted_job_title), ''),
    'declarationVersion', submitted_declaration_version,
    'signatureStrokes', submitted_signature_strokes
  )::text, 'UTF8'), 'sha256'), 'hex');

  select * into confirmation_row from public.confirmations where id = target_confirmation_id for update;
  if confirmation_row.id is null
    or not public.has_organization_role(confirmation_row.buyer_organization_id, 'buyer') then
    raise insufficient_privilege using message = 'The buyer decision could not be saved.';
  end if;

  if confirmation_row.status <> 'pending' then
    if confirmation_row.decided_by = auth.uid() and confirmation_row.decision_payload_hash = payload_hash then
      return jsonb_build_object('confirmationId', confirmation_row.id, 'status', confirmation_row.status, 'approvalId', confirmation_row.approval_id, 'replayed', true);
    end if;
    raise unique_violation using message = 'This request already has an immutable decision.';
  end if;

  select * into application_row from public.applications where id = confirmation_row.application_id for update;
  if application_row.id is null or application_row.status <> 'buyer_pending'
    or application_row.buyer_organization_id <> confirmation_row.buyer_organization_id then
    raise check_violation using message = 'This request is no longer awaiting confirmation.';
  end if;

  select p.display_name, o.name, u.email, u.email_confirmed_at
  into profile_name, organization_name, corporate_email, email_confirmed_at
  from public.profiles p
  join public.memberships m on m.profile_id = p.id and m.role = 'buyer'
  join public.organizations o on o.id = m.organization_id
  join auth.users u on u.id = p.id
  where p.id = auth.uid() and m.organization_id = confirmation_row.buyer_organization_id;

  if profile_name is null or organization_name is null or corporate_email is null or email_confirmed_at is null then
    raise insufficient_privilege using message = 'A verified corporate buyer identity is required.';
  end if;

  snapshot := jsonb_build_object(
    'buyer', organization_name,
    'supplier', (select name from public.organizations where id = application_row.owner_organization_id),
    'purchaseOrder', application_row.purchase_order_reference,
    'invoice', application_row.invoice_number,
    'currency', application_row.currency,
    'invoiceAmountMinor', application_row.invoice_total_minor,
    'outstandingAmountMinor', application_row.invoice_total_minor,
    'expectedPaymentDate', application_row.invoice_due_on
  );

  if has_negative then
    select string_agg(key || ': ' || trim(submitted_explanations ->> key), '; ' order by key)
    into negative_reason from unnest(required_keys) key where submitted_answers -> key = 'false'::jsonb;

    update public.confirmations set
      status = 'disputed', answers = submitted_answers, answer_explanations = coalesce(submitted_explanations, '{}'::jsonb),
      transaction_snapshot = snapshot, reason = negative_reason, decided_at = decision_time, decided_by = auth.uid(),
      representative_name = profile_name, representative_company = organization_name, representative_email = lower(corporate_email),
      decision_payload_hash = payload_hash
    where id = confirmation_row.id;
    update public.applications set status = 'buyer_disputed' where id = application_row.id;
    v012_result := 'fail';
  else
    approval := gen_random_uuid();
    update public.confirmations set
      status = 'confirmed', answers = submitted_answers, answer_explanations = '{}'::jsonb, transaction_snapshot = snapshot,
      order_recognized = true, delivery_received = true, amount_recognized = true, reason = null,
      declaration_version = submitted_declaration_version, representative_name = profile_name,
      representative_job_title = trim(submitted_job_title), representative_company = organization_name,
      representative_email = lower(corporate_email), signature_strokes = submitted_signature_strokes,
      approval_id = approval, decided_at = decision_time, decided_by = auth.uid(), decision_payload_hash = payload_hash
    where id = confirmation_row.id;
    update public.applications set status = 'buyer_confirmed' where id = application_row.id;
    v012_result := 'pass';
  end if;

  select * into latest_run from public.verification_runs
  where application_id = application_row.id and status = 'completed' and rule_version = 'verification-v1'
  order by completed_at desc, created_at desc limit 1;
  if latest_run.id is null then raise check_violation using message = 'The verification record is unavailable.'; end if;

  if v012_result = 'fail' or exists(select 1 from public.verification_checks where verification_run_id=latest_run.id and rule_code<>'V012' and result='fail') then next_overall := 'fail';
  elsif exists(select 1 from public.verification_checks where verification_run_id=latest_run.id and rule_code<>'V012' and result='review') then next_overall := 'review'; else next_overall := 'pass'; end if;
  next_run_id := gen_random_uuid();
  insert into public.verification_runs (id, application_id, initiated_by, status, started_at, completed_at, rule_version, overall_result)
  values (next_run_id, application_row.id, auth.uid(), 'completed', decision_time, decision_time, 'verification-v1', next_overall);
  insert into public.verification_checks (verification_run_id, application_id, rule_code, result, explanation, evidence)
  select next_run_id, application_row.id, vc.rule_code, vc.result, vc.explanation, vc.evidence
  from public.verification_checks vc where vc.verification_run_id = latest_run.id and vc.rule_code <> 'V012';
  insert into public.verification_checks (verification_run_id, application_id, rule_code, result, explanation, evidence)
  values (next_run_id, application_row.id, 'V012', v012_result,
    case when v012_result = 'pass' then 'The authorized buyer representative confirmed all six receivable facts and signed the declaration.' else 'The buyer disputed one or more receivable facts and supplied an explanation.' end,
    jsonb_build_object('ruleId','V012','version','verification-v1','status',v012_result,'severity',case when v012_result='pass' then 'info' else 'blocking' end,'title','Buyer confirmation','explanation',case when v012_result='pass' then 'The authorized buyer representative confirmed all six receivable facts and signed the declaration.' else 'The buyer disputed one or more receivable facts and supplied an explanation.' end,'comparedValues',jsonb_build_object('confirmationStatus',case when has_negative then 'disputed' else 'confirmed' end),'sourceDocumentIds','[]'::jsonb));

  insert into public.audit_events (organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata)
  values (application_row.owner_organization_id, application_row.id, auth.uid(), case when has_negative then 'buyer.confirmation_disputed' else 'buyer.confirmation_signed' end,
    'confirmation', confirmation_row.id, jsonb_build_object('approvalId', approval, 'verificationRunId', next_run_id, 'declarationVersion', submitted_declaration_version));

  return jsonb_build_object('confirmationId', confirmation_row.id, 'status', case when has_negative then 'disputed' else 'confirmed' end, 'approvalId', approval, 'replayed', false);
end;
$$;

revoke all on function public.submit_buyer_confirmation_v1(uuid, jsonb, jsonb, text, text, jsonb) from public, anon;
grant execute on function public.submit_buyer_confirmation_v1(uuid, jsonb, jsonb, text, text, jsonb) to authenticated;

create or replace function public.block_completed_confirmation_changes()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status <> 'pending' then raise check_violation using message = 'Completed buyer decisions are immutable.'; end if;
  return new;
end;
$$;

create trigger confirmations_block_completed_changes before update on public.confirmations
for each row execute function public.block_completed_confirmation_changes();
