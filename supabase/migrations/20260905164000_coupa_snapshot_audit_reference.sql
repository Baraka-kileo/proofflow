create or replace function public.persist_demo_coupa_result_v1(target_application_id uuid,target_connection_id uuid,target_idempotency_key text,target_correlation_id text,target_outcome public.integration_outcome,target_evidence jsonb,target_checks jsonb,target_error_code text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare app public.applications%rowtype; conn public.integration_connections%rowtype; run public.integration_sync_runs%rowtype; snapshot_id uuid; confirmation_id uuid;
begin
  select * into app from public.applications where id=target_application_id for update;
  select * into conn from public.integration_connections where id=target_connection_id;
  if auth.uid() is null or app.id is null or conn.id is null or conn.buyer_organization_id<>app.buyer_organization_id or not public.has_organization_role(app.owner_organization_id,'sme') or app.status not in ('checks_complete','buyer_system_checking','buyer_exception_review','buyer_system_blocked','buyer_system_verified','buyer_pending') then raise insufficient_privilege using message='Buyer-system verification could not be saved.'; end if;
  select * into run from public.integration_sync_runs where application_id=app.id and idempotency_key=target_idempotency_key;
  if run.id is not null then return jsonb_build_object('syncRunId',run.id,'outcome',run.outcome,'replayed',true); end if;
  if target_outcome='manual_confirmation_required' then
    insert into public.integration_sync_runs(application_id,connection_id,status,outcome,idempotency_key,started_at,completed_at,error_code,correlation_id) values(app.id,conn.id,'unavailable',target_outcome,target_idempotency_key,now(),now(),coalesce(target_error_code,'COUPA_UNAVAILABLE'),target_correlation_id) returning * into run;
    insert into public.confirmations(application_id,buyer_organization_id) values(app.id,app.buyer_organization_id) on conflict(application_id) do nothing returning id into confirmation_id;
    if confirmation_id is null then select id into confirmation_id from public.confirmations where application_id=app.id; end if;
    update public.applications set status='buyer_pending',submitted_at=coalesce(submitted_at,now()) where id=app.id;
  else
    if jsonb_typeof(target_evidence)<>'object' or jsonb_typeof(target_checks)<>'array' or jsonb_array_length(target_checks)<>10 or exists(select 1 from jsonb_array_elements(target_checks) item where item->>'ruleId' not in ('C001','C002','C003','C004','C005','C006','C007','C008','C009','C010') or item->>'result' not in ('pass','review','fail')) then raise check_violation using message='Buyer-system evidence is incomplete.'; end if;
    insert into public.integration_sync_runs(application_id,connection_id,status,outcome,idempotency_key,started_at,completed_at,correlation_id) values(app.id,conn.id,'completed',target_outcome,target_idempotency_key,now(),now(),target_correlation_id) returning * into run;
    insert into public.external_evidence_snapshots(application_id,sync_run_id,provider,provider_mode,external_supplier_id,external_po_id,external_invoice_id,canonical_evidence,payload_hash,retrieved_at) values(app.id,run.id,conn.provider,conn.mode,target_evidence#>>'{supplier,externalId}',target_evidence#>>'{purchaseOrder,externalId}',target_evidence#>>'{invoice,externalId}',target_evidence,encode(extensions.digest(convert_to(target_evidence::text,'UTF8'),'sha256'),'hex'),(target_evidence->>'retrievedAt')::timestamptz) returning id into snapshot_id;
    insert into public.integration_checks(application_id,sync_run_id,rule_code,result,title,explanation,evidence) select app.id,run.id,item->>'ruleId',(item->>'result')::public.check_result,item->>'title',item->>'explanation',item->'evidence' from jsonb_array_elements(target_checks) item;
    update public.applications set status=case target_outcome when 'system_verified' then 'buyer_system_verified'::public.application_status when 'review_required' then 'buyer_exception_review'::public.application_status else 'buyer_system_blocked'::public.application_status end,submitted_at=coalesce(submitted_at,now()) where id=app.id;
    update public.integration_connections set last_successful_sync_at=now(),last_error_code=null where id=conn.id;
  end if;
  insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'integration.coupa_checked','integration_sync_run',run.id,jsonb_build_object('provider','coupa','mode','demo','outcome',target_outcome,'correlationId',target_correlation_id,'snapshotId',snapshot_id));
  return jsonb_build_object('syncRunId',run.id,'outcome',target_outcome,'confirmationId',confirmation_id,'replayed',false);
end;$$;
