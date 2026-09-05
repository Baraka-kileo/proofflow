insert into public.organizations (id, name, slug, kind, registration_number, is_demo)
values
  ('11111111-1111-4111-8111-111111111111', 'Ndlovu Office Supplies', 'ndlovu-office-supplies', 'sme', '2024/000101/07', false),
  ('22222222-2222-4222-8222-222222222222', 'Ubuntu Retail Group', 'ubuntu-retail-group', 'buyer', '2022/000202/07', false),
  ('33333333-3333-4333-8333-333333333333', 'Cape Growth Finance', 'cape-growth-finance', 'funder', '2023/000303/07', false),
  ('44444444-4444-4444-8444-444444444444', 'Mokoena Catering Services', 'mokoena-catering-services', 'sme', '2024/000404/07', false)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  kind = excluded.kind,
  registration_number = excluded.registration_number,
  is_demo = false;
