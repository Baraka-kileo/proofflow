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

comment on function public.initialize_manual_evidence_v1(uuid) is
  'Creates the fixed human-entry evidence template without reading or transmitting document contents.';
