alter table public.applications
add column purchase_order_reference text,
add column ai_processing_consented_at timestamptz;

alter table public.applications
add constraint applications_purchase_order_reference_format
check (
  purchase_order_reference is null
  or char_length(trim(purchase_order_reference)) between 3 and 80
);
