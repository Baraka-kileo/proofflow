drop policy if exists "members read relevant organizations" on public.organizations;
create policy "members read relevant organizations"
on public.organizations for select to authenticated
using (
  kind = 'buyer'
  or exists (
    select 1 from public.memberships m
    where m.profile_id = auth.uid() and m.organization_id = organizations.id
  )
  or exists (
    select 1 from public.applications a
    where public.can_read_application(a.id)
      and (a.owner_organization_id = organizations.id or a.buyer_organization_id = organizations.id)
  )
);

delete from public.integration_sync_runs
where connection_id in (
  select id from public.integration_connections where mode = 'demo'
);

delete from public.integration_connections where mode = 'demo';

update public.organizations set
  name = case id
    when '11111111-1111-4111-8111-111111111111' then 'Ndlovu Office Supplies'
    when '22222222-2222-4222-8222-222222222222' then 'Ubuntu Retail Group'
    when '33333333-3333-4333-8333-333333333333' then 'Cape Growth Finance'
    when '44444444-4444-4444-8444-444444444444' then 'Mokoena Catering Services'
    else name end,
  slug = case id
    when '11111111-1111-4111-8111-111111111111' then 'ndlovu-office-supplies'
    when '22222222-2222-4222-8222-222222222222' then 'ubuntu-retail-group'
    when '33333333-3333-4333-8333-333333333333' then 'cape-growth-finance'
    when '44444444-4444-4444-8444-444444444444' then 'mokoena-catering-services'
    else slug end,
  registration_number = case id
    when '11111111-1111-4111-8111-111111111111' then '2024/000101/07'
    when '22222222-2222-4222-8222-222222222222' then '2022/000202/07'
    when '33333333-3333-4333-8333-333333333333' then '2023/000303/07'
    when '44444444-4444-4444-8444-444444444444' then '2024/000404/07'
    else registration_number end,
  is_demo = false
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
);
