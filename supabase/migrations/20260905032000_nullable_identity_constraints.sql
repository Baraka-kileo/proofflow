alter table public.organizations
drop constraint organizations_kind_registration_number_key;

create unique index organizations_registration_identity_key
on public.organizations (kind, registration_number)
where registration_number is not null;

do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_constraint c
  where c.conrelid = 'public.applications'::regclass
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) like '%owner_organization_id%buyer_organization_id%invoice_number%';

  if constraint_name is null then
    raise exception 'Expected invoice identity constraint was not found';
  end if;

  execute format('alter table public.applications drop constraint %I', constraint_name);
end;
$$;

create unique index applications_invoice_identity_key
on public.applications (owner_organization_id, buyer_organization_id, invoice_number)
where invoice_number is not null;
