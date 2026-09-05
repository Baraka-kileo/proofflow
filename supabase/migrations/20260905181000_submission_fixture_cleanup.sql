-- Keep the public submission workspace focused on the four canonical fictional
-- records. These organizations and IDs are reserved for repository testing.
delete from public.applications
where owner_organization_id in (
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444'
)
and id not in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
);

update public.applications
set
  invoice_number = replace(replace(invoice_number, '-DEMO', ''), ' demo', ''),
  purchase_order_reference = replace(replace(purchase_order_reference, '-DEMO', ''), ' demo', '')
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
);

update public.offers
set response_reason = 'The requested advance does not meet this funder''s current underwriting criteria.'
where application_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  and decision_kind = 'decline';

-- An earlier fictional flow marked this record as if money had moved. The
-- current product stops at accepted terms until a real partner callback exists.
update public.applications
set status = 'offer_accepted'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
  and status = 'funded_simulated';

delete from public.audit_events
where application_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
  and action = 'application.simulated_funding_completed';
