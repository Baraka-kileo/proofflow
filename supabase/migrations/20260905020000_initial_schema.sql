create extension if not exists pgcrypto with schema extensions;

create type public.organization_kind as enum ('sme', 'buyer', 'funder');
create type public.user_role as enum ('sme', 'buyer', 'funder');
create type public.application_status as enum (
  'draft',
  'documents_uploaded',
  'fields_extracted',
  'sme_reviewed',
  'checks_complete',
  'buyer_pending',
  'buyer_confirmed',
  'buyer_disputed',
  'funder_review',
  'offer_made',
  'offer_accepted',
  'offer_declined',
  'funded_simulated'
);
create type public.document_kind as enum ('purchase_order', 'delivery_evidence', 'invoice');
create type public.extraction_status as enum ('pending', 'processing', 'extracted', 'reviewed', 'failed');
create type public.field_review_status as enum ('unreviewed', 'accepted', 'corrected');
create type public.verification_run_status as enum ('pending', 'running', 'completed', 'failed');
create type public.check_result as enum ('pass', 'review', 'fail');
create type public.confirmation_status as enum ('pending', 'confirmed', 'disputed');
create type public.offer_status as enum ('draft', 'offered', 'accepted', 'declined', 'expired');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind public.organization_kind not null,
  registration_number text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (kind, registration_number)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id),
  check (
    (role = 'sme') or (role = 'buyer') or (role = 'funder')
  )
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references public.organizations (id) on delete restrict,
  buyer_organization_id uuid not null references public.organizations (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  status public.application_status not null default 'draft',
  currency text not null default 'ZAR' check (currency ~ '^[A-Z]{3}$'),
  requested_amount_minor bigint check (requested_amount_minor is null or requested_amount_minor >= 0),
  invoice_number text,
  invoice_total_minor bigint check (invoice_total_minor is null or invoice_total_minor >= 0),
  invoice_issued_on date,
  invoice_due_on date,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (invoice_due_on is null or invoice_issued_on is null or invoice_due_on >= invoice_issued_on),
  unique nulls not distinct (owner_organization_id, buyer_organization_id, invoice_number)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  owner_organization_id uuid not null references public.organizations (id) on delete restrict,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  kind public.document_kind not null,
  original_filename text not null check (char_length(trim(original_filename)) between 1 and 180),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  extraction_status public.extraction_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, kind),
  unique (owner_organization_id, sha256)
);

create table public.document_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  field_name text not null check (field_name ~ '^[a-z][a-z0-9_]*$'),
  source_value jsonb,
  normalized_value jsonb,
  confidence_bps integer check (confidence_bps between 0 and 10000),
  review_status public.field_review_status not null default 'unreviewed',
  reviewed_by uuid references public.profiles (id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, field_name),
  check (
    (review_status = 'unreviewed' and reviewed_by is null and reviewed_at is null)
    or (review_status <> 'unreviewed' and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.verification_runs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  initiated_by uuid not null references public.profiles (id) on delete restrict,
  status public.verification_run_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.verification_checks (
  id uuid primary key default gen_random_uuid(),
  verification_run_id uuid not null references public.verification_runs (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  rule_code text not null check (rule_code ~ '^[A-Z][A-Z0-9_]*$'),
  result public.check_result not null,
  explanation text not null check (char_length(trim(explanation)) between 3 and 500),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (verification_run_id, rule_code)
);

create table public.confirmations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  buyer_organization_id uuid not null references public.organizations (id) on delete restrict,
  status public.confirmation_status not null default 'pending',
  order_recognized boolean,
  delivery_received boolean,
  amount_recognized boolean,
  reason text check (reason is null or char_length(trim(reason)) between 3 and 500),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and decided_at is null and decided_by is null)
    or (status <> 'pending' and decided_at is not null and decided_by is not null)
  ),
  check (status <> 'disputed' or reason is not null)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  funder_organization_id uuid not null references public.organizations (id) on delete restrict,
  status public.offer_status not null default 'draft',
  currency text not null default 'ZAR' check (currency ~ '^[A-Z]{3}$'),
  advance_amount_minor bigint not null check (advance_amount_minor > 0),
  fee_amount_minor bigint not null check (fee_amount_minor >= 0),
  net_advance_minor bigint not null check (net_advance_minor >= 0),
  fee_bps integer not null check (fee_bps between 0 and 10000),
  expires_at timestamptz not null,
  made_by uuid not null references public.profiles (id) on delete restrict,
  responded_by uuid references public.profiles (id) on delete restrict,
  responded_at timestamptz,
  response_reason text check (response_reason is null or char_length(trim(response_reason)) between 3 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, funder_organization_id),
  check (net_advance_minor = advance_amount_minor - fee_amount_minor),
  check (
    (status in ('accepted', 'declined') and responded_by is not null and responded_at is not null)
    or (status not in ('accepted', 'declined') and responded_by is null and responded_at is null)
  )
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  application_id uuid references public.applications (id) on delete cascade,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null check (action ~ '^[a-z][a-z0-9_.]*$'),
  resource_type text not null check (resource_type ~ '^[a-z][a-z0-9_]*$'),
  resource_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index applications_owner_status_idx on public.applications (owner_organization_id, status);
create index applications_buyer_status_idx on public.applications (buyer_organization_id, status);
create index documents_application_idx on public.documents (application_id);
create index document_fields_document_idx on public.document_fields (document_id);
create index verification_runs_application_idx on public.verification_runs (application_id, created_at desc);
create index verification_checks_application_idx on public.verification_checks (application_id);
create index confirmations_buyer_status_idx on public.confirmations (buyer_organization_id, status, requested_at);
create index offers_funder_status_idx on public.offers (funder_organization_id, status, created_at desc);
create index audit_events_application_idx on public.audit_events (application_id, created_at);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents
for each row execute function public.set_updated_at();
create trigger document_fields_set_updated_at before update on public.document_fields
for each row execute function public.set_updated_at();
create trigger verification_runs_set_updated_at before update on public.verification_runs
for each row execute function public.set_updated_at();
create trigger confirmations_set_updated_at before update on public.confirmations
for each row execute function public.set_updated_at();
create trigger offers_set_updated_at before update on public.offers
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.document_fields enable row level security;
alter table public.verification_runs enable row level security;
alter table public.verification_checks enable row level security;
alter table public.confirmations enable row level security;
alter table public.offers enable row level security;
alter table public.audit_events enable row level security;
