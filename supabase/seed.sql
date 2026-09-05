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
