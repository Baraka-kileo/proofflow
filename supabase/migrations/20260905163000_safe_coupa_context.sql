create or replace function public.get_demo_coupa_context(target_application_id uuid)
returns jsonb language plpgsql security definer stable set search_path='' as $$
declare app public.applications%rowtype; connection public.integration_connections%rowtype; mapping public.supplier_mappings%rowtype;
begin
  select * into app from public.applications where id=target_application_id;
  if auth.uid() is null or app.id is null or not public.has_organization_role(app.owner_organization_id,'sme') then raise insufficient_privilege using message='Buyer-system context is unavailable.'; end if;
  select * into connection from public.integration_connections where buyer_organization_id=app.buyer_organization_id and provider='coupa';
  if connection.id is null then return null; end if;
  select * into mapping from public.supplier_mappings where connection_id=connection.id and sme_organization_id=app.owner_organization_id and status='verified';
  return jsonb_build_object('connection',jsonb_build_object('id',connection.id,'status',connection.status,'mode',connection.mode,'demo_scenario',connection.demo_scenario),'mapping',case when mapping.id is null then null else jsonb_build_object('external_supplier_id',mapping.external_supplier_id,'external_supplier_name',mapping.external_supplier_name,'status',mapping.status) end);
end;$$;

revoke all on function public.get_demo_coupa_context(uuid) from public,anon;
grant execute on function public.get_demo_coupa_context(uuid) to authenticated;
