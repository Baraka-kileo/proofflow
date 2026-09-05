update public.applications set purchase_order_reference = case id
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' then 'PO-2039-DEMO'
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' then 'PO-2040-DEMO'
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' then 'PO-1184-DEMO'
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4' then 'PO-1180-DEMO' end
where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4');

alter table public.confirmations disable trigger confirmations_block_completed_changes;
update public.confirmations c set
  answers = '{"poIssued":true,"deliveryAccepted":true,"invoiceRecognized":true,"amountCorrect":true,"invoiceOutstanding":true,"paymentDateCorrect":true}'::jsonb,
  answer_explanations = '{}'::jsonb,
  transaction_snapshot = jsonb_build_object('buyer', buyer.name, 'supplier', supplier.name, 'purchaseOrder', a.purchase_order_reference, 'invoice', a.invoice_number, 'currency', a.currency, 'invoiceAmountMinor', a.invoice_total_minor, 'outstandingAmountMinor', a.invoice_total_minor, 'expectedPaymentDate', a.invoice_due_on),
  declaration_version = 'buyer-declaration-v1', representative_name = 'Lebo Molefe', representative_job_title = case when c.id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' then 'Accounts Payable Manager' else 'Finance Manager' end,
  representative_company = buyer.name, representative_email = 'buyer.demo@proofflow.example',
  signature_strokes = '[[{"x":0.08,"y":0.65},{"x":0.23,"y":0.25},{"x":0.4,"y":0.72},{"x":0.61,"y":0.3},{"x":0.9,"y":0.55}]]'::jsonb,
  approval_id = case when c.id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' then 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'::uuid else 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4'::uuid end,
  decision_payload_hash = 'legacy-demo-upgraded'
from public.applications a
join public.organizations buyer on buyer.id=a.buyer_organization_id
join public.organizations supplier on supplier.id=a.owner_organization_id
where c.application_id=a.id and c.status='confirmed' and c.id in ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4');
alter table public.confirmations enable trigger confirmations_block_completed_changes;

do $$
declare app record; run_id uuid; rule_number integer; rule_code text; rule_result public.check_result;
begin
  for app in select a.id,a.created_by from public.applications a where a.id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3') loop
    if not exists(select 1 from public.verification_runs vr where vr.application_id=app.id and vr.rule_version='verification-v1' and vr.status='completed') then
      run_id:=gen_random_uuid();
      insert into public.verification_runs(id,application_id,initiated_by,status,started_at,completed_at,rule_version,overall_result) values(run_id,app.id,app.created_by,'completed',now(),now(),'verification-v1','review');
      for rule_number in 1..12 loop
        rule_code:='V'||lpad(rule_number::text,3,'0');rule_result:=case when rule_number=12 then 'review'::public.check_result else 'pass'::public.check_result end;
        insert into public.verification_checks(verification_run_id,application_id,rule_code,result,explanation,evidence) values(run_id,app.id,rule_code,rule_result,case when rule_number=12 then 'Buyer confirmation is awaiting a decision.' else 'Synthetic Demo evidence is consistent.' end,jsonb_build_object('ruleId',rule_code,'version','verification-v1','status',rule_result,'severity',case when rule_number=12 then 'warning' else 'info' end,'title','Demo '||rule_code,'explanation',case when rule_number=12 then 'Buyer confirmation is awaiting a decision.' else 'Synthetic Demo evidence is consistent.' end,'comparedValues',jsonb_build_object('demo','synthetic'),'sourceDocumentIds','[]'::jsonb));
      end loop;
    end if;
  end loop;
end $$;
