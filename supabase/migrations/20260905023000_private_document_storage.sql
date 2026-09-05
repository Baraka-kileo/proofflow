insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.can_read_application_document(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[] := storage.foldername(object_name);
  path_organization_id uuid;
  path_application_id uuid;
  path_document_id uuid;
begin
  if array_length(path_parts, 1) <> 3
    or storage.filename(object_name) !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$'
    or lower(storage.extension(object_name)) not in ('pdf', 'jpg', 'jpeg', 'png') then
    return false;
  end if;

  path_organization_id := path_parts[1]::uuid;
  path_application_id := path_parts[2]::uuid;
  path_document_id := path_parts[3]::uuid;

  return exists (
    select 1
    from public.documents d
    join public.applications a on a.id = d.application_id
    join public.memberships m on m.profile_id = auth.uid()
    where d.id = path_document_id
      and d.application_id = path_application_id
      and d.owner_organization_id = path_organization_id
      and d.storage_path = object_name
      and (
        (m.role = 'sme' and m.organization_id = a.owner_organization_id)
        or (m.role = 'buyer' and m.organization_id = a.buyer_organization_id and a.status not in ('draft', 'documents_uploaded', 'fields_extracted', 'sme_reviewed', 'checks_complete'))
        or (m.role = 'funder' and a.status in ('buyer_confirmed', 'funder_review', 'offer_made', 'offer_accepted', 'offer_declined', 'funded_simulated'))
      )
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

create function public.can_write_application_document(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[] := storage.foldername(object_name);
  path_organization_id uuid;
  path_application_id uuid;
  path_document_id uuid;
begin
  if array_length(path_parts, 1) <> 3
    or storage.filename(object_name) !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$'
    or lower(storage.extension(object_name)) not in ('pdf', 'jpg', 'jpeg', 'png') then
    return false;
  end if;

  path_organization_id := path_parts[1]::uuid;
  path_application_id := path_parts[2]::uuid;
  path_document_id := path_parts[3]::uuid;

  return exists (
    select 1
    from public.documents d
    join public.applications a on a.id = d.application_id
    join public.memberships m on m.profile_id = auth.uid()
    where d.id = path_document_id
      and d.application_id = path_application_id
      and d.owner_organization_id = path_organization_id
      and d.storage_path = object_name
      and m.role = 'sme'
      and m.organization_id = a.owner_organization_id
      and a.status in ('draft', 'documents_uploaded', 'fields_extracted')
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke all on function public.can_read_application_document(text) from public;
revoke all on function public.can_write_application_document(text) from public;
grant execute on function public.can_read_application_document(text) to authenticated;
grant execute on function public.can_write_application_document(text) to authenticated;

create policy "authorized members can read application documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'application-documents'
  and public.can_read_application_document(name)
);

create policy "sme members can upload draft application documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'application-documents'
  and public.can_write_application_document(name)
);

create policy "sme members can replace draft application documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'application-documents'
  and public.can_write_application_document(name)
)
with check (
  bucket_id = 'application-documents'
  and public.can_write_application_document(name)
);

create policy "sme members can delete draft application documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'application-documents'
  and public.can_write_application_document(name)
);
