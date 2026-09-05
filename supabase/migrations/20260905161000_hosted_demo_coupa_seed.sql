insert into public.integration_connections(id,buyer_organization_id,provider,mode,instance_url,status,demo_scenario)
select 'c0000000-0000-4000-8000-000000000001',id,'coupa','demo','https://demo.coupa.invalid','active','match'
from public.organizations where id='22222222-2222-4222-8222-222222222222' and is_demo
on conflict(buyer_organization_id,provider) do nothing;

insert into public.supplier_mappings(buyer_organization_id,sme_organization_id,connection_id,external_supplier_id,external_supplier_name,status,verified_at)
select '22222222-2222-4222-8222-222222222222',organization.id,'c0000000-0000-4000-8000-000000000001',mapping.external_id,organization.name,'verified',now()
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid,'DEMO-SUP-NDLOVU'),
  ('44444444-4444-4444-8444-444444444444'::uuid,'DEMO-SUP-MOKOENA')
) mapping(organization_id,external_id)
join public.organizations organization on organization.id=mapping.organization_id and organization.is_demo
where exists(select 1 from public.integration_connections connection where connection.id='c0000000-0000-4000-8000-000000000001')
on conflict(connection_id,sme_organization_id) do nothing;
