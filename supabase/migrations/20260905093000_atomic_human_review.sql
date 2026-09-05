drop policy if exists "sme members review extracted fields" on public.document_fields;

create or replace function public.submit_application_field_review(
  target_application_id uuid,
  reviewed_fields jsonb
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
  corrected_count integer;
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

  if jsonb_typeof(reviewed_fields) <> 'array' then
    raise exception 'invalid review payload' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(reviewed_fields) item
    where jsonb_typeof(item) <> 'object'
      or not item ? 'id'
      or not item ? 'value'
      or (select count(*) from jsonb_object_keys(item)) <> 2
      or item ->> 'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) then
    raise exception 'invalid review item' using errcode = '22023';
  end if;

  if (select count(*) from jsonb_array_elements(reviewed_fields))
    <> (select count(distinct item ->> 'id') from jsonb_array_elements(reviewed_fields) item) then
    raise exception 'duplicate review item' using errcode = '22023';
  end if;

  if (select count(*) from public.documents d where d.application_id = target_application.id and d.extraction_status = 'extracted') <> 3
    or (select count(*) from public.document_fields f join public.documents d on d.id = f.document_id where d.application_id = target_application.id) <> 21
    or exists (
      select 1
      from public.document_fields f
      join public.documents d on d.id = f.document_id
      where d.application_id = target_application.id
        and not (
          (d.kind = 'purchase_order' and f.field_name = any(array['buyer_legal_name','supplier_legal_name','purchase_order_reference','issue_date','currency','order_total']))
          or (d.kind = 'delivery_evidence' and f.field_name = any(array['buyer_legal_name','supplier_legal_name','purchase_order_reference','delivery_or_completion_date','receiver_or_signature_present']))
          or (d.kind = 'invoice' and f.field_name = any(array['buyer_legal_name','supplier_legal_name','invoice_number','purchase_order_reference','issue_date','due_date','currency','subtotal','tax','total']))
        )
    ) then
    raise exception 'extraction record incomplete' using errcode = '23514';
  end if;

  select count(*) into field_count
  from jsonb_array_elements(reviewed_fields) item
  join public.document_fields f on f.id::text = item ->> 'id'
  join public.documents d on d.id = f.document_id
  where d.application_id = target_application.id;

  if field_count <> 21 or jsonb_array_length(reviewed_fields) <> 21 then
    raise exception 'review must include every extracted field' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(reviewed_fields) item
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
    raise exception 'review contains an invalid value' using errcode = '22023';
  end if;

  if target_application.status = 'sme_reviewed' then
    if exists (
      select 1
      from jsonb_array_elements(reviewed_fields) item
      join public.document_fields f on f.id::text = item ->> 'id'
      where f.review_status = 'unreviewed'
         or f.reviewed_by is null
         or f.normalized_value <> case
           when f.field_name = 'receiver_or_signature_present' then item -> 'value'
           else to_jsonb(trim(item ->> 'value'))
         end
    ) then
      raise exception 'review already submitted' using errcode = '23514';
    end if;

    select count(*) into corrected_count
    from public.document_fields f
    join public.documents d on d.id = f.document_id
    where d.application_id = target_application.id and f.review_status = 'corrected';
    return jsonb_build_object('fieldCount', 21, 'correctedCount', corrected_count, 'replayed', true);
  end if;

  with payload as (
    select item ->> 'id' as id, item -> 'value' as value
    from jsonb_array_elements(reviewed_fields) item
  )
  update public.document_fields f
  set normalized_value = case
        when f.field_name = 'receiver_or_signature_present' then payload.value
        else to_jsonb(trim(payload.value #>> '{}'))
      end,
      review_status = case
        when f.normalized_value = case
          when f.field_name = 'receiver_or_signature_present' then payload.value
          else to_jsonb(trim(payload.value #>> '{}'))
        end then 'accepted'::public.field_review_status
        else 'corrected'::public.field_review_status
      end,
      reviewed_by = actor_id,
      reviewed_at = now()
  from payload
  where f.id::text = payload.id;

  update public.documents d
  set extraction_status = 'reviewed'
  where d.application_id = target_application.id and d.extraction_status = 'extracted';

  update public.applications
  set status = 'sme_reviewed'
  where id = target_application.id and status = 'fields_extracted';

  select count(*) into corrected_count
  from public.document_fields f
  join public.documents d on d.id = f.document_id
  where d.application_id = target_application.id and f.review_status = 'corrected';

  insert into public.audit_events (
    organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata
  ) values (
    target_application.owner_organization_id, target_application.id, actor_id,
    'application.fields_reviewed', 'application', target_application.id,
    jsonb_build_object('schemaVersion','extraction-v1','fieldCount',21,'correctedCount',corrected_count)
  );

  return jsonb_build_object('fieldCount', 21, 'correctedCount', corrected_count, 'replayed', false);
end;
$$;

revoke all on function public.submit_application_field_review(uuid, jsonb) from public, anon;
grant execute on function public.submit_application_field_review(uuid, jsonb) to authenticated;
