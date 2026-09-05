alter table public.applications
  add column if not exists evidence_declaration_accepted_at timestamptz;

alter table public.documents
  add column if not exists entry_method text
  check (entry_method is null or entry_method in ('manual', 'structured_import', 'buyer_system'));

create or replace function public.initialize_manual_evidence_v1(target_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  actor_id uuid := auth.uid();
  target_document public.documents%rowtype;
  required_field_name text;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into target_application
  from public.applications
  where id = target_application_id
  for update;

  if target_application.id is null
    or target_application.status not in ('documents_uploaded', 'fields_extracted')
    or not exists (
      select 1 from public.memberships m
      where m.profile_id = actor_id
        and m.organization_id = target_application.owner_organization_id
        and m.role = 'sme'
    ) then
    raise exception 'application unavailable' using errcode = '42501';
  end if;

  if (select count(*) from public.documents d where d.application_id = target_application.id and d.upload_completed_at is not null) <> 3 then
    raise exception 'three completed documents required' using errcode = '23514';
  end if;

  for target_document in
    select * from public.documents d
    where d.application_id = target_application.id and d.upload_completed_at is not null
    order by d.kind
  loop
    for required_field_name in
      select unnest(case target_document.kind
        when 'purchase_order'::public.document_kind then array['buyer_legal_name','supplier_legal_name','purchase_order_reference','issue_date','currency','order_total']
        when 'delivery_evidence'::public.document_kind then array['buyer_legal_name','supplier_legal_name','purchase_order_reference','delivery_or_completion_date','receiver_or_signature_present']
        else array['buyer_legal_name','supplier_legal_name','invoice_number','purchase_order_reference','issue_date','due_date','currency','subtotal','tax','total']
      end)
    loop
      insert into public.document_fields (
        document_id, field_name, source_value, normalized_value, confidence_bps,
        source_label, review_status
      ) values (
        target_document.id, required_field_name, null, null, null,
        'Entered by SME', 'unreviewed'
      )
      on conflict (document_id, field_name) do nothing;
    end loop;

    update public.documents
    set extraction_status = 'extracted',
        extraction_schema_version = 'evidence-entry-v1',
        extraction_provider = 'manual-entry',
        extraction_model = null,
        extraction_response = null,
        extraction_provider_metadata = '{}'::jsonb,
        extraction_completed_at = null,
        extraction_error_code = null,
        entry_method = 'manual'
    where id = target_document.id;
  end loop;

  if (select count(*) from public.document_fields f join public.documents d on d.id = f.document_id where d.application_id = target_application.id) <> 21 then
    raise exception 'evidence template incomplete' using errcode = '23514';
  end if;

  update public.applications
  set status = 'fields_extracted'
  where id = target_application.id and status = 'documents_uploaded';

  if target_application.status = 'documents_uploaded' then
    insert into public.audit_events (
      organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata
    ) values (
      target_application.owner_organization_id, target_application.id, actor_id,
      'application.evidence_entry_started', 'application', target_application.id,
      jsonb_build_object('schemaVersion', 'evidence-entry-v1', 'fieldCount', 21)
    );
  end if;

  return jsonb_build_object('fieldCount', 21, 'schemaVersion', 'evidence-entry-v1');
end;
$$;

revoke all on function public.initialize_manual_evidence_v1(uuid) from public, anon;
grant execute on function public.initialize_manual_evidence_v1(uuid) to authenticated;

create or replace function public.submit_manual_evidence_v1(
  target_application_id uuid,
  entered_fields jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  actor_id uuid := auth.uid();
  field_count integer;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into target_application
  from public.applications
  where id = target_application_id
  for update;

  if target_application.id is null
    or target_application.status not in ('fields_extracted', 'sme_reviewed')
    or not exists (
      select 1 from public.memberships m
      where m.profile_id = actor_id
        and m.organization_id = target_application.owner_organization_id
        and m.role = 'sme'
    ) then
    raise exception 'application unavailable' using errcode = '42501';
  end if;

  if jsonb_typeof(entered_fields) <> 'array'
    or jsonb_array_length(entered_fields) <> 21
    or (select count(distinct item ->> 'id') from jsonb_array_elements(entered_fields) item) <> 21
    or exists (
      select 1 from jsonb_array_elements(entered_fields) item
      where jsonb_typeof(item) <> 'object'
        or not item ? 'id'
        or not item ? 'value'
        or (select count(*) from jsonb_object_keys(item)) <> 2
        or item ->> 'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) then
    raise exception 'invalid evidence payload' using errcode = '22023';
  end if;

  select count(*) into field_count
  from jsonb_array_elements(entered_fields) item
  join public.document_fields f on f.id::text = item ->> 'id'
  join public.documents d on d.id = f.document_id
  where d.application_id = target_application.id;

  if field_count <> 21 then
    raise exception 'evidence must include every required field' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(entered_fields) item
    join public.document_fields f on f.id::text = item ->> 'id'
    where (f.field_name = 'receiver_or_signature_present' and jsonb_typeof(item -> 'value') <> 'boolean')
       or (f.field_name <> 'receiver_or_signature_present' and (
         jsonb_typeof(item -> 'value') <> 'string'
         or char_length(trim(item ->> 'value')) not between 1 and 300
       ))
       or (f.field_name in ('issue_date','due_date','delivery_or_completion_date') and (
         item ->> 'value' !~ '^\d{4}-\d{2}-\d{2}$'
         or to_char(to_date(item ->> 'value','YYYY-MM-DD'),'YYYY-MM-DD') <> item ->> 'value'
       ))
       or (f.field_name = 'currency' and item ->> 'value' !~ '^[A-Z]{3}$')
       or (f.field_name in ('order_total','subtotal','tax','total') and item ->> 'value' !~ '^\d+(\.\d{1,2})?$')
  ) then
    raise exception 'evidence contains an invalid value' using errcode = '22023';
  end if;

  if target_application.status = 'sme_reviewed' then
    if exists (
      select 1
      from jsonb_array_elements(entered_fields) item
      join public.document_fields f on f.id::text = item ->> 'id'
      join public.documents d on d.id = f.document_id and d.application_id = target_application.id
      where f.reviewed_by is null
         or f.normalized_value <> case
           when f.field_name = 'receiver_or_signature_present' then item -> 'value'
           else to_jsonb(trim(item ->> 'value'))
         end
    ) then
      raise exception 'evidence already submitted with different values' using errcode = '23514';
    end if;
    return jsonb_build_object('fieldCount', 21, 'replayed', true);
  end if;

  with payload as (
    select item ->> 'id' as id, item -> 'value' as value
    from jsonb_array_elements(entered_fields) item
  )
  update public.document_fields f
  set source_value = case
        when f.field_name = 'receiver_or_signature_present' then payload.value
        else to_jsonb(trim(payload.value #>> '{}'))
      end,
      normalized_value = case
        when f.field_name = 'receiver_or_signature_present' then payload.value
        else to_jsonb(trim(payload.value #>> '{}'))
      end,
      confidence_bps = null,
      source_label = 'Entered by SME',
      review_status = 'accepted',
      reviewed_by = actor_id,
      reviewed_at = now()
  from payload
  where f.id::text = payload.id;

  update public.documents d
  set extraction_status = 'reviewed', entry_method = 'manual'
  where d.application_id = target_application.id and d.extraction_status = 'extracted';

  update public.applications
  set status = 'sme_reviewed', evidence_declaration_accepted_at = now()
  where id = target_application.id and status = 'fields_extracted';

  insert into public.audit_events (
    organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata
  ) values (
    target_application.owner_organization_id, target_application.id, actor_id,
    'application.evidence_entered', 'application', target_application.id,
    jsonb_build_object('schemaVersion', 'evidence-entry-v1', 'fieldCount', 21)
  );

  return jsonb_build_object('fieldCount', 21, 'replayed', false);
end;
$$;

revoke all on function public.submit_manual_evidence_v1(uuid, jsonb) from public, anon;
grant execute on function public.submit_manual_evidence_v1(uuid, jsonb) to authenticated;

comment on function public.initialize_manual_evidence_v1(uuid) is
  'Creates the fixed human-entry evidence template without reading or transmitting document contents.';
comment on function public.submit_manual_evidence_v1(uuid, jsonb) is
  'Validates and atomically records the SME-entered evidence set.';
