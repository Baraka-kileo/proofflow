-- Replace obsolete prototype labels in the canonical fictional verification
-- scenarios with the same plain-language names used by the current rules.
with definitions(rule_code, title, pass_explanation) as (
  values
    ('V001', 'Large customer identity', 'The same large customer appears across the reviewed evidence.'),
    ('V002', 'Supplier identity', 'The same supplier appears across the reviewed evidence.'),
    ('V003', 'Purchase order reference', 'The purchase order reference agrees across the reviewed evidence.'),
    ('V004', 'Currency', 'The purchase order and invoice use the same currency.'),
    ('V005', 'Invoice versus order total', 'The invoice total does not exceed the purchase order total.'),
    ('V006', 'Invoice arithmetic', 'Subtotal plus tax agrees with the invoice total.'),
    ('V007', 'Purchase order timing', 'The purchase order predates delivery and invoicing.'),
    ('V008', 'Delivery versus invoice timing', 'Delivery occurred on or before the invoice date.'),
    ('V009', 'Exact document duplicate', 'No earlier identical file was found for this supplier organization.'),
    ('V010', 'Invoice identity duplicate', 'This invoice identity is unique for the supplier organization.'),
    ('V011', 'Delivery acknowledgement', 'The delivery evidence includes a receiver or signature acknowledgement.'),
    ('V012', 'Customer confirmation', 'The large customer has confirmed the receivable in ProofFlow.')
)
update public.verification_checks checks
set
  explanation = case
    when checks.rule_code = 'V012' and checks.result = 'review'
      then 'Customer confirmation is still pending.'
    else definitions.pass_explanation
  end,
  evidence = jsonb_build_object(
    'ruleId', checks.rule_code,
    'version', 'verification-v1',
    'status', checks.result,
    'severity', case when checks.result = 'review' then 'warning' else 'info' end,
    'title', definitions.title,
    'explanation', case
      when checks.rule_code = 'V012' and checks.result = 'review'
        then 'Customer confirmation is still pending.'
      else definitions.pass_explanation
    end,
    'comparedValues', case checks.rule_code
      when 'V003' then jsonb_build_object('Purchase order', applications.purchase_order_reference)
      when 'V004' then jsonb_build_object('Currency', applications.currency)
      when 'V010' then jsonb_build_object('Invoice number', applications.invoice_number, 'Duplicate found', 'No')
      when 'V012' then jsonb_build_object('Customer status', case when checks.result = 'review' then 'Pending' else 'Confirmed' end)
      else jsonb_build_object('Result', 'Consistent')
    end,
    'sourceDocumentIds', '[]'::jsonb
  )
from definitions, public.applications applications
where applications.id = checks.application_id
  and checks.rule_code = definitions.rule_code
  and checks.application_id in (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
  );
