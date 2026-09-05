create table if not exists public.external_compliance_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  funding_partner_organization_id uuid not null references public.organizations(id),
  status text not null default 'required'
    check (status in ('required','in_progress','additional_information_required','completed','unable_to_verify','expired')),
  provider_name text,
  external_reference text,
  completed_at timestamptz,
  expires_at timestamptz,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(coalesce(provider_name, '')) <= 120),
  check (char_length(coalesce(external_reference, '')) <= 160)
);

alter table public.external_compliance_checks enable row level security;

revoke all on public.external_compliance_checks from public, anon;
grant select on public.external_compliance_checks to authenticated;

create policy "application participants can read compliance status"
on public.external_compliance_checks for select to authenticated
using (public.can_read_application(application_id));

create or replace function public.record_external_compliance_status_v1(
  target_application_id uuid,
  target_status text,
  target_provider_name text default null,
  target_external_reference text default null,
  target_completed_at timestamptz default null,
  target_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  funder_org uuid;
  target_application public.applications%rowtype;
  saved public.external_compliance_checks%rowtype;
begin
  select organization_id into funder_org from public.memberships where profile_id = actor_id and role = 'funder' limit 1;
  if actor_id is null or funder_org is null then
    raise exception 'funder access required' using errcode = '42501';
  end if;

  if target_status not in ('required','in_progress','additional_information_required','completed','unable_to_verify','expired') then
    raise exception 'invalid compliance status' using errcode = '22023';
  end if;

  select * into target_application from public.applications
  where id = target_application_id for update;
  if target_application.id is null or target_application.status not in
    ('funder_review','offer_made','offer_accepted','offer_declined','funded_simulated') then
    raise exception 'application is not in funder review' using errcode = '22023';
  end if;

  if not public.can_read_application(target_application_id) then
    raise exception 'application unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.external_compliance_checks c
    where c.application_id = target_application_id
      and c.funding_partner_organization_id <> funder_org
  ) or exists (
    select 1 from public.offers o
    where o.application_id = target_application_id
      and o.funder_organization_id <> funder_org
  ) then
    raise exception 'application belongs to another funding partner' using errcode = '42501';
  end if;

  insert into public.external_compliance_checks (
    application_id, funding_partner_organization_id, status, provider_name,
    external_reference, completed_at, expires_at, recorded_by
  ) values (
    target_application_id, funder_org, target_status,
    nullif(trim(target_provider_name), ''), nullif(trim(target_external_reference), ''),
    case when target_status = 'completed' then coalesce(target_completed_at, now()) else target_completed_at end,
    target_expires_at, actor_id
  )
  on conflict (application_id) do update set
    funding_partner_organization_id = excluded.funding_partner_organization_id,
    status = excluded.status,
    provider_name = excluded.provider_name,
    external_reference = excluded.external_reference,
    completed_at = excluded.completed_at,
    expires_at = excluded.expires_at,
    recorded_by = excluded.recorded_by,
    updated_at = now()
  returning * into saved;

  insert into public.audit_events (organization_id, application_id, actor_profile_id, action, resource_type, resource_id, metadata)
  values (funder_org, target_application_id, actor_id, 'application.external_compliance_status_recorded',
    'external_compliance_check', saved.id,
    jsonb_build_object('status', saved.status, 'funding_partner_organization_id', funder_org));

  return jsonb_build_object('id', saved.id, 'status', saved.status);
end;
$$;

revoke all on function public.record_external_compliance_status_v1(uuid,text,text,text,timestamptz,timestamptz) from public;
grant execute on function public.record_external_compliance_status_v1(uuid,text,text,text,timestamptz,timestamptz) to authenticated;

comment on table public.external_compliance_checks is
'Workflow status reported by a funding partner. ProofFlow does not perform or decide KYC, KYB, AML, sanctions screening, or underwriting.';
