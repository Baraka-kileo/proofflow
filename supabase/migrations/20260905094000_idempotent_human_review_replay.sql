alter function public.submit_application_field_review(uuid, jsonb)
  rename to submit_application_field_review_once;

revoke all on function public.submit_application_field_review_once(uuid, jsonb) from public, anon, authenticated;

create function public.submit_application_field_review(
  target_application_id uuid,
  reviewed_fields jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  actor_id uuid := auth.uid();
  corrected_count integer;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into target_application
  from public.applications
  where id = target_application_id
  for update;

  if target_application.id is null
    or target_application.status not in ('fields_extracted', 'sme_reviewed')
    or not exists (
      select 1 from public.memberships m
      where m.profile_id = actor_id
        and m.organization_id = target_application.owner_organization_id
        and m.role = 'sme'
    ) then
    raise exception 'application unavailable' using errcode = '42501';
  end if;

  if target_application.status = 'fields_extracted' then
    return public.submit_application_field_review_once(target_application_id, reviewed_fields);
  end if;

  if jsonb_typeof(reviewed_fields) <> 'array'
    or jsonb_array_length(reviewed_fields) <> 21
    or (select count(distinct item ->> 'id') from jsonb_array_elements(reviewed_fields) item) <> 21
    or exists (
      select 1
      from jsonb_array_elements(reviewed_fields) item
      left join public.document_fields f on f.id::text = item ->> 'id'
      left join public.documents d on d.id = f.document_id and d.application_id = target_application.id
      where jsonb_typeof(item) <> 'object'
        or not item ? 'id'
        or not item ? 'value'
        or (select count(*) from jsonb_object_keys(item)) <> 2
        or d.id is null
        or f.review_status = 'unreviewed'
        or f.reviewed_by is null
        or f.normalized_value <> case
          when f.field_name = 'receiver_or_signature_present' then item -> 'value'
          else to_jsonb(trim(item ->> 'value'))
        end
    ) then
    raise exception 'review already submitted with different values' using errcode = '23514';
  end if;

  select count(*) into corrected_count
  from public.document_fields f
  join public.documents d on d.id = f.document_id
  where d.application_id = target_application.id and f.review_status = 'corrected';

  return jsonb_build_object('fieldCount', 21, 'correctedCount', corrected_count, 'replayed', true);
end;
$$;

revoke all on function public.submit_application_field_review(uuid, jsonb) from public, anon;
grant execute on function public.submit_application_field_review(uuid, jsonb) to authenticated;
