create function public.has_organization_role(target_organization_id uuid, target_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.profile_id = auth.uid()
      and m.organization_id = target_organization_id
      and m.role = target_role
  );
$$;

create function public.can_read_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    where a.id = target_application_id
      and (
        public.has_organization_role(a.owner_organization_id, 'sme')
        or (
          public.has_organization_role(a.buyer_organization_id, 'buyer')
          and a.status in ('buyer_pending', 'buyer_confirmed', 'buyer_disputed', 'funder_review', 'offer_made', 'offer_accepted', 'offer_declined', 'funded_simulated')
        )
        or (
          exists (
            select 1 from public.memberships m
            where m.profile_id = auth.uid() and m.role = 'funder'
          )
          and a.status in ('buyer_confirmed', 'funder_review', 'offer_made', 'offer_accepted', 'offer_declined', 'funded_simulated')
        )
      )
  );
$$;

create function public.can_edit_sme_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    where a.id = target_application_id
      and public.has_organization_role(a.owner_organization_id, 'sme')
      and a.status in ('draft', 'documents_uploaded', 'fields_extracted', 'sme_reviewed')
  );
$$;

revoke all on function public.has_organization_role(uuid, public.user_role) from public;
revoke all on function public.can_read_application(uuid) from public;
revoke all on function public.can_edit_sme_application(uuid) from public;
grant execute on function public.has_organization_role(uuid, public.user_role) to authenticated;
grant execute on function public.can_read_application(uuid) to authenticated;
grant execute on function public.can_edit_sme_application(uuid) to authenticated;

create policy "users read their own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "users update their own display name"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "members read relevant organizations"
on public.organizations for select to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.profile_id = auth.uid() and m.organization_id = organizations.id
  )
  or (is_demo and kind = 'buyer')
  or exists (
    select 1 from public.applications a
    where public.can_read_application(a.id)
      and (a.owner_organization_id = organizations.id or a.buyer_organization_id = organizations.id)
  )
);

create policy "users read only their memberships"
on public.memberships for select to authenticated
using (profile_id = auth.uid());

create policy "authorized roles read applications"
on public.applications for select to authenticated
using (public.can_read_application(id));

create policy "sme members create own drafts"
on public.applications for insert to authenticated
with check (
  created_by = auth.uid()
  and status = 'draft'
  and public.has_organization_role(owner_organization_id, 'sme')
  and exists (
    select 1 from public.organizations buyer
    where buyer.id = buyer_organization_id and buyer.kind = 'buyer'
  )
);

create policy "sme members update own editable applications"
on public.applications for update to authenticated
using (public.can_edit_sme_application(id))
with check (
  public.has_organization_role(owner_organization_id, 'sme')
  and created_by = auth.uid()
  and status in ('draft', 'documents_uploaded', 'fields_extracted', 'sme_reviewed')
);

create policy "sme members delete own drafts"
on public.applications for delete to authenticated
using (
  status = 'draft'
  and public.has_organization_role(owner_organization_id, 'sme')
);

create policy "authorized roles read documents"
on public.documents for select to authenticated
using (public.can_read_application(application_id));

create policy "sme members register own documents"
on public.documents for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and public.can_edit_sme_application(application_id)
  and public.has_organization_role(owner_organization_id, 'sme')
  and exists (
    select 1 from public.applications a
    where a.id = application_id and a.owner_organization_id = owner_organization_id
  )
);

create policy "sme members update own editable documents"
on public.documents for update to authenticated
using (public.can_edit_sme_application(application_id))
with check (
  uploaded_by = auth.uid()
  and public.can_edit_sme_application(application_id)
  and public.has_organization_role(owner_organization_id, 'sme')
);

create policy "sme members delete own editable documents"
on public.documents for delete to authenticated
using (public.can_edit_sme_application(application_id));

create policy "authorized roles read document fields"
on public.document_fields for select to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.can_read_application(d.application_id)
  )
);

create policy "sme members review extracted fields"
on public.document_fields for update to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id and public.can_edit_sme_application(d.application_id)
  )
)
with check (
  reviewed_by = auth.uid()
  and review_status in ('accepted', 'corrected')
  and exists (
    select 1 from public.documents d
    where d.id = document_id and public.can_edit_sme_application(d.application_id)
  )
);

create policy "authorized roles read verification runs"
on public.verification_runs for select to authenticated
using (public.can_read_application(application_id));

create policy "authorized roles read immutable verification checks"
on public.verification_checks for select to authenticated
using (public.can_read_application(application_id));

create policy "authorized roles read confirmations"
on public.confirmations for select to authenticated
using (public.can_read_application(application_id));

create policy "sme members request buyer confirmation"
on public.confirmations for insert to authenticated
with check (
  status = 'pending'
  and decided_by is null
  and public.has_organization_role(
    (select a.owner_organization_id from public.applications a where a.id = application_id),
    'sme'
  )
  and buyer_organization_id = (
    select a.buyer_organization_id from public.applications a where a.id = application_id
  )
);

create policy "addressed buyer decides pending confirmation"
on public.confirmations for update to authenticated
using (
  status = 'pending'
  and public.has_organization_role(buyer_organization_id, 'buyer')
)
with check (
  status in ('confirmed', 'disputed')
  and decided_by = auth.uid()
  and public.has_organization_role(buyer_organization_id, 'buyer')
);

create policy "application parties read offers"
on public.offers for select to authenticated
using (
  public.has_organization_role(
    (select a.owner_organization_id from public.applications a where a.id = application_id),
    'sme'
  )
  or public.has_organization_role(funder_organization_id, 'funder')
);

create policy "funders create offers for eligible applications"
on public.offers for insert to authenticated
with check (
  made_by = auth.uid()
  and status in ('draft', 'offered')
  and public.has_organization_role(funder_organization_id, 'funder')
  and exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.status in ('buyer_confirmed', 'funder_review')
  )
);

create policy "offer parties update their own allowed offer"
on public.offers for update to authenticated
using (
  public.has_organization_role(funder_organization_id, 'funder')
  or public.has_organization_role(
    (select a.owner_organization_id from public.applications a where a.id = application_id),
    'sme'
  )
)
with check (
  public.has_organization_role(funder_organization_id, 'funder')
  or (
    status in ('accepted', 'declined')
    and responded_by = auth.uid()
    and public.has_organization_role(
      (select a.owner_organization_id from public.applications a where a.id = application_id),
      'sme'
    )
  )
);

create policy "authorized roles read audit history"
on public.audit_events for select to authenticated
using (application_id is not null and public.can_read_application(application_id));
