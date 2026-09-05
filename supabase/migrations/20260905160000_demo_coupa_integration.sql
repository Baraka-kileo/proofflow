create type public.integration_provider as enum ('coupa');
create type public.integration_mode as enum ('demo', 'live');
create type public.integration_connection_status as enum ('active', 'disconnected', 'error', 'revoked');
create type public.integration_sync_status as enum ('running', 'completed', 'unavailable', 'failed');
create type public.integration_outcome as enum ('system_verified', 'review_required', 'blocked', 'manual_confirmation_required');
create type public.integration_resolution_choice as enum ('external_value', 'supplier_value', 'other_issue');

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  buyer_organization_id uuid not null references public.organizations(id) on delete cascade,
  provider public.integration_provider not null,
  mode public.integration_mode not null default 'demo',
  instance_url text,
  credential_reference text,
  status public.integration_connection_status not null default 'active',
  demo_scenario text not null default 'match' check (demo_scenario in ('match','invoice_missing','amount_mismatch','receipt_missing','already_paid','disconnected')),
  connected_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null default now(),
  last_successful_sync_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_organization_id, provider)
);

create table public.supplier_mappings (
  id uuid primary key default gen_random_uuid(),
  buyer_organization_id uuid not null references public.organizations(id) on delete cascade,
  sme_organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  external_supplier_id text not null,
  external_supplier_name text not null,
  status text not null default 'verified' check (status in ('pending','verified','disabled')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (connection_id, sme_organization_id)
);

create table public.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete restrict,
  status public.integration_sync_status not null,
  outcome public.integration_outcome,
  idempotency_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_code text,
  correlation_id text not null,
  created_at timestamptz not null default now(),
  unique (application_id, idempotency_key)
);

create table public.external_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sync_run_id uuid not null unique references public.integration_sync_runs(id) on delete cascade,
  provider public.integration_provider not null,
  provider_mode public.integration_mode not null,
  external_supplier_id text,
  external_po_id text,
  external_invoice_id text,
  canonical_evidence jsonb not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  retrieved_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.integration_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sync_run_id uuid not null references public.integration_sync_runs(id) on delete cascade,
  rule_code text not null check (rule_code ~ '^C0(0[1-9]|10)$'),
  result public.check_result not null,
  title text not null,
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (sync_run_id, rule_code)
);

create table public.integration_exception_resolutions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  integration_check_id uuid not null unique references public.integration_checks(id) on delete restrict,
  choice public.integration_resolution_choice not null,
  explanation text,
  resolved_by uuid not null references public.profiles(id) on delete restrict,
  resolved_at timestamptz not null default now(),
  check (choice <> 'other_issue' or char_length(trim(coalesce(explanation,''))) between 3 and 500)
);

create index integration_connections_buyer_idx on public.integration_connections(buyer_organization_id);
create index supplier_mappings_orgs_idx on public.supplier_mappings(buyer_organization_id,sme_organization_id);
create index integration_sync_runs_application_idx on public.integration_sync_runs(application_id,created_at desc);
create index integration_checks_application_idx on public.integration_checks(application_id,created_at desc);

create trigger integration_connections_set_updated_at before update on public.integration_connections for each row execute function public.set_updated_at();

alter table public.integration_connections enable row level security;
alter table public.supplier_mappings enable row level security;
alter table public.integration_sync_runs enable row level security;
alter table public.external_evidence_snapshots enable row level security;
alter table public.integration_checks enable row level security;
alter table public.integration_exception_resolutions enable row level security;

create policy "buyers read own safe connection metadata" on public.integration_connections for select to authenticated using (public.has_organization_role(buyer_organization_id,'buyer'));
create policy "buyers read own supplier mappings" on public.supplier_mappings for select to authenticated using (public.has_organization_role(buyer_organization_id,'buyer'));
create policy "application parties read integration runs" on public.integration_sync_runs for select to authenticated using (public.can_read_application(application_id));
create policy "application parties read canonical evidence" on public.external_evidence_snapshots for select to authenticated using (public.can_read_application(application_id));
create policy "application parties read integration checks" on public.integration_checks for select to authenticated using (public.can_read_application(application_id));
create policy "application parties read exception resolutions" on public.integration_exception_resolutions for select to authenticated using (public.can_read_application(application_id));

revoke all on public.integration_connections from anon;
revoke select on public.integration_connections from authenticated;
grant select (id,buyer_organization_id,provider,mode,instance_url,status,demo_scenario,connected_by,connected_at,last_successful_sync_at,last_error_code,created_at,updated_at) on public.integration_connections to authenticated;
grant select on public.supplier_mappings,public.integration_sync_runs,public.external_evidence_snapshots,public.integration_checks,public.integration_exception_resolutions to authenticated;

create or replace function public.can_read_application(target_application_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.applications a where a.id=target_application_id and (
    public.has_organization_role(a.owner_organization_id,'sme')
    or (public.has_organization_role(a.buyer_organization_id,'buyer') and a.status in ('buyer_pending','buyer_confirmed','buyer_disputed','buyer_exception_review','buyer_system_verified','funder_review','offer_made','offer_accepted','offer_declined','funded_simulated'))
    or (exists(select 1 from public.memberships m where m.profile_id=auth.uid() and m.role='funder') and a.status in ('buyer_confirmed','buyer_system_verified','funder_review','offer_made','offer_accepted','offer_declined','funded_simulated'))
  ));
$$;

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

create or replace function public.resolve_coupa_exception_v1(target_check_id uuid,target_choice public.integration_resolution_choice,target_explanation text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare check_row public.integration_checks%rowtype; app public.applications%rowtype; resolution_id uuid; remaining integer;
begin
  select * into check_row from public.integration_checks where id=target_check_id for update;
  select * into app from public.applications where id=check_row.application_id for update;
  if auth.uid() is null or check_row.id is null or app.status<>'buyer_exception_review' or check_row.result='pass' or not public.has_organization_role(app.buyer_organization_id,'buyer') then raise insufficient_privilege using message='This exception could not be resolved.'; end if;
  insert into public.integration_exception_resolutions(application_id,integration_check_id,choice,explanation,resolved_by) values(app.id,check_row.id,target_choice,nullif(trim(target_explanation),''),auth.uid()) returning id into resolution_id;
  if target_choice='other_issue' then update public.applications set status='buyer_disputed' where id=app.id;
  else
    select count(*) into remaining from public.integration_checks c left join public.integration_exception_resolutions r on r.integration_check_id=c.id where c.sync_run_id=check_row.sync_run_id and c.result='review' and r.id is null;
    if remaining=0 then update public.applications set status='buyer_system_verified' where id=app.id; update public.integration_sync_runs set outcome='system_verified' where id=check_row.sync_run_id; end if;
  end if;
  insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'integration.exception_resolved','integration_exception_resolution',resolution_id,jsonb_build_object('choice',target_choice,'ruleCode',check_row.rule_code));
  return jsonb_build_object('resolutionId',resolution_id,'applicationStatus',(select status from public.applications where id=app.id));
end;$$;

create or replace function public.start_funder_review(target_application_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare app public.applications%rowtype; funder_org uuid;
begin
  select organization_id into funder_org from public.memberships where profile_id=auth.uid() and role='funder' limit 1;
  select * into app from public.applications where id=target_application_id for update;
  if funder_org is null or app.id is null or app.status not in ('buyer_confirmed','buyer_system_verified','funder_review') then raise insufficient_privilege using message='The funder review could not be started.'; end if;
  if app.status in ('buyer_confirmed','buyer_system_verified') then update public.applications set status='funder_review' where id=app.id; insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'funder.review_started','application',app.id,jsonb_build_object('funderOrganizationId',funder_org,'evidencePath',case when app.status='buyer_system_verified' then 'buyer_system' else 'human_confirmation' end)); end if;
  return jsonb_build_object('applicationId',app.id,'status','funder_review','replayed',app.status='funder_review');
end;$$;

create or replace function public.set_demo_coupa_scenario(target_connection_id uuid,target_scenario text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare conn public.integration_connections%rowtype;
begin
  if target_scenario not in ('match','invoice_missing','amount_mismatch','receipt_missing','already_paid','disconnected') then raise check_violation using message='Choose a valid Demo Coupa scenario.'; end if;
  select * into conn from public.integration_connections where id=target_connection_id for update;
  if conn.id is null or conn.mode<>'demo' or not public.has_organization_role(conn.buyer_organization_id,'buyer') then raise insufficient_privilege using message='The Demo Coupa scenario could not be changed.'; end if;
  update public.integration_connections set demo_scenario=target_scenario,status=case when target_scenario='disconnected' then 'disconnected'::public.integration_connection_status else 'active'::public.integration_connection_status end,last_error_code=null where id=conn.id;
  insert into public.audit_events(organization_id,actor_profile_id,action,resource_type,resource_id,metadata) values(conn.buyer_organization_id,auth.uid(),'integration.demo_scenario_changed','integration_connection',conn.id,jsonb_build_object('scenario',target_scenario));
  return jsonb_build_object('connectionId',conn.id,'scenario',target_scenario);
end;$$;

revoke all on function public.persist_demo_coupa_result_v1(uuid,uuid,text,text,public.integration_outcome,jsonb,jsonb,text),public.resolve_coupa_exception_v1(uuid,public.integration_resolution_choice,text),public.set_demo_coupa_scenario(uuid,text) from public,anon;
grant execute on function public.persist_demo_coupa_result_v1(uuid,uuid,text,text,public.integration_outcome,jsonb,jsonb,text),public.resolve_coupa_exception_v1(uuid,public.integration_resolution_choice,text),public.set_demo_coupa_scenario(uuid,text) to authenticated;
