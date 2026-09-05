drop function if exists public.persist_document_extraction_v1(uuid, uuid, jsonb, jsonb, text, jsonb);

create function public.persist_document_extraction_v1(
  target_document_id uuid,
  target_actor_profile_id uuid,
  raw_extraction jsonb,
  normalized_fields jsonb,
  provider_name text,
  provider_model text,
  provider_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_document public.documents%rowtype;
  target_application public.applications%rowtype;
  field record;
begin
  select * into target_document from public.documents where id = target_document_id for update;
  if target_document.id is null or target_document.upload_completed_at is null then raise exception 'document unavailable' using errcode = '23514'; end if;
  select * into target_application from public.applications where id = target_document.application_id for update;
  if target_application.id is null or target_application.created_by <> target_actor_profile_id or target_application.status not in ('documents_uploaded', 'fields_extracted') then raise exception 'application unavailable' using errcode = '23514'; end if;
  if jsonb_typeof(raw_extraction) <> 'object' or raw_extraction ->> 'schemaVersion' <> 'extraction-v1' or raw_extraction ->> 'documentKind' <> target_document.kind::text or jsonb_typeof(raw_extraction -> 'fields') <> 'object' or jsonb_typeof(normalized_fields) <> 'object' or nullif(trim(provider_name), '') is null or provider_name not in ('google-gemini', 'proofflow-demo-fixture') or nullif(trim(provider_model), '') is null then raise exception 'invalid extraction payload' using errcode = '22023'; end if;
  delete from public.document_fields where document_id = target_document.id;
  for field in select key, value from jsonb_each(raw_extraction -> 'fields') loop
    if not normalized_fields ? field.key then raise exception 'normalized field missing' using errcode = '22023'; end if;
    insert into public.document_fields (document_id,field_name,source_value,normalized_value,confidence_bps,source_label,review_status)
    values (target_document.id,lower(regexp_replace(regexp_replace(field.key, '([a-z0-9])([A-Z])', '\1_\2', 'g'), '[^a-zA-Z0-9_]', '', 'g'))::text,field.value -> 'value',normalized_fields -> field.key,(field.value ->> 'confidenceBps')::integer,field.value ->> 'sourceLabel','unreviewed');
  end loop;
  update public.documents set extraction_status='extracted',extraction_schema_version='extraction-v1',extraction_provider=trim(provider_name),extraction_model=trim(provider_model),extraction_response=raw_extraction,extraction_provider_metadata=coalesce(provider_metadata,'{}'::jsonb),extraction_completed_at=now(),extraction_error_code=null where id=target_document.id;
  if (select count(*)=3 from public.documents where application_id=target_application.id and upload_completed_at is not null and extraction_status='extracted') then update public.applications set status='fields_extracted' where id=target_application.id and status='documents_uploaded'; end if;
  insert into public.audit_events (organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata)
  values (target_document.owner_organization_id,target_document.application_id,target_actor_profile_id,'document.extracted','document',target_document.id,jsonb_build_object('schemaVersion','extraction-v1','provider',trim(provider_name),'model',trim(provider_model)));
end;
$$;

revoke all on function public.persist_document_extraction_v1(uuid, uuid, jsonb, jsonb, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.persist_document_extraction_v1(uuid, uuid, jsonb, jsonb, text, text, jsonb) to service_role;
