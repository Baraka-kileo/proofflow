insert into public.organizations (id, name, slug, kind, registration_number, is_demo)
values
  ('11111111-1111-4111-8111-111111111111', 'Ndlovu Office Supply Demo', 'ndlovu-office-supply-demo', 'sme', 'DEMO-SME-001', true),
  ('22222222-2222-4222-8222-222222222222', 'Ubuntu Retail Group Demo', 'ubuntu-retail-group-demo', 'buyer', 'DEMO-BUYER-001', true),
  ('33333333-3333-4333-8333-333333333333', 'ProofFlow Capital Demo', 'proofflow-capital-demo', 'funder', 'DEMO-FUNDER-001', true),
  ('44444444-4444-4444-8444-444444444444', 'Mokoena Catering Demo', 'mokoena-catering-demo', 'sme', 'DEMO-SME-002', true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  kind = excluded.kind,
  registration_number = excluded.registration_number,
  is_demo = true;

insert into public.integration_connections(id,buyer_organization_id,provider,mode,instance_url,status,demo_scenario)
values('c0000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','coupa','demo','https://demo.coupa.invalid','active','match')
on conflict(buyer_organization_id,provider) do update set mode='demo',status='active',demo_scenario='match',credential_reference=null;

insert into public.supplier_mappings(buyer_organization_id,sme_organization_id,connection_id,external_supplier_id,external_supplier_name,status,verified_at)
values
('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','c0000000-0000-4000-8000-000000000001','DEMO-SUP-NDLOVU','Ndlovu Office Supply Demo','verified',now()),
('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','c0000000-0000-4000-8000-000000000001','DEMO-SUP-MOKOENA','Mokoena Catering Demo','verified',now())
on conflict(connection_id,sme_organization_id) do update set external_supplier_id=excluded.external_supplier_id,external_supplier_name=excluded.external_supplier_name,status='verified',verified_at=now();
