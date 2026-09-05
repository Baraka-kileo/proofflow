create or replace function public.enforce_demo_coupa_sync_prerequisites()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.integration_connections connection where connection.id=new.connection_id and connection.provider='coupa' and connection.mode='demo') then
    raise check_violation using message='Demo Coupa requires a Demo Coupa connection.';
  end if;
  if not exists(select 1 from public.verification_runs run where run.application_id=new.application_id and run.status='completed' and run.rule_version='verification-v1' and run.overall_result in ('pass','review')) then
    raise check_violation using message='Complete document verification before checking the buyer system.';
  end if;
  return new;
end;$$;

create trigger integration_sync_runs_require_verified_documents
before insert on public.integration_sync_runs
for each row execute function public.enforce_demo_coupa_sync_prerequisites();

revoke all on function public.enforce_demo_coupa_sync_prerequisites() from public,anon,authenticated;
