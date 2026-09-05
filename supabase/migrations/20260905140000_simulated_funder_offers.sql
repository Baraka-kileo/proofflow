alter table public.offers
add column advance_bps integer not null default 0 check (advance_bps between 0 and 10000),
add column invoice_amount_minor bigint check (invoice_amount_minor is null or invoice_amount_minor > 0),
add column payment_due_on date,
add column decision_kind text not null default 'offer' check (decision_kind in ('offer','decline')),
add column decision_payload_hash text;

alter table public.offers drop constraint if exists offers_advance_amount_minor_check;
alter table public.offers add constraint offers_advance_shape check (
  (decision_kind='decline' and advance_bps=0 and advance_amount_minor=0 and fee_amount_minor=0 and net_advance_minor=0 and fee_bps=0)
  or (decision_kind='offer' and advance_bps between 1 and 10000 and advance_amount_minor>0 and fee_amount_minor>=0 and fee_amount_minor<advance_amount_minor and net_advance_minor=advance_amount_minor-fee_amount_minor)
);

drop policy if exists "offer parties update their own allowed offer" on public.offers;
drop policy if exists "funders create offers for eligible applications" on public.offers;

create or replace function public.start_funder_review(target_application_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare app public.applications%rowtype; funder_org uuid;
begin
  select organization_id into funder_org from public.memberships where profile_id=auth.uid() and role='funder' limit 1;
  select * into app from public.applications where id=target_application_id for update;
  if funder_org is null or app.id is null or app.status not in ('buyer_confirmed','funder_review') then raise insufficient_privilege using message='The funder review could not be started.'; end if;
  if app.status='buyer_confirmed' then
    update public.applications set status='funder_review' where id=app.id;
    insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'funder.review_started','application',app.id,jsonb_build_object('funderOrganizationId',funder_org));
  end if;
  return jsonb_build_object('applicationId',app.id,'status','funder_review','replayed',app.status='funder_review');
end;$$;

create or replace function public.create_funder_decision_v1(target_application_id uuid,target_advance_bps integer default null,target_fee_bps integer default null,target_expiry_date date default null,target_decline_reason text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare app public.applications%rowtype; funder_org uuid; offer_row public.offers%rowtype; offer_id uuid:=gen_random_uuid(); advance_minor bigint; fee_minor bigint; payload_hash text; is_decline boolean:=target_decline_reason is not null; expiry_time timestamptz;
begin
  select organization_id into funder_org from public.memberships where profile_id=auth.uid() and role='funder' limit 1;
  if funder_org is null then raise insufficient_privilege using message='The funder decision could not be saved.'; end if;
  select * into app from public.applications where id=target_application_id for update;
  if app.id is null then raise insufficient_privilege using message='The funder decision could not be saved.'; end if;
  payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('applicationId',target_application_id,'advanceBps',target_advance_bps,'feeBps',target_fee_bps,'expiryDate',target_expiry_date,'declineReason',nullif(trim(target_decline_reason),''))::text,'UTF8'),'sha256'),'hex');
  select * into offer_row from public.offers where application_id=app.id and funder_organization_id=funder_org for update;
  if offer_row.id is not null then
    if offer_row.decision_payload_hash=payload_hash then return jsonb_build_object('offerId',offer_row.id,'status',offer_row.status,'replayed',true); end if;
    raise unique_violation using message='This funder decision is immutable.';
  end if;
  if app.status<>'funder_review' then raise check_violation using message='Start the funder review before deciding.'; end if;
  if app.invoice_total_minor is null or app.invoice_total_minor<=0 or app.invoice_due_on is null then raise check_violation using message='The invoice terms are incomplete.'; end if;
  if is_decline then
    if char_length(trim(target_decline_reason)) not between 3 and 500 or target_advance_bps is not null or target_fee_bps is not null or target_expiry_date is not null then raise check_violation using message='Provide one valid decline reason.'; end if;
    insert into public.offers(id,application_id,funder_organization_id,status,currency,advance_amount_minor,fee_amount_minor,net_advance_minor,fee_bps,advance_bps,invoice_amount_minor,payment_due_on,expires_at,made_by,responded_by,responded_at,response_reason,decision_kind,decision_payload_hash)
    values(offer_id,app.id,funder_org,'declined',app.currency,0,0,0,0,0,app.invoice_total_minor,app.invoice_due_on,now(),auth.uid(),auth.uid(),now(),trim(target_decline_reason),'decline',payload_hash);
    update public.applications set status='offer_declined' where id=app.id;
    insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'funder.application_declined','offer',offer_id,jsonb_build_object('funderOrganizationId',funder_org));
  else
    if target_advance_bps is null or target_fee_bps is null or target_advance_bps not between 1 and 10000 or target_fee_bps not between 0 and 9999 or target_expiry_date is null or target_expiry_date<=current_date then raise check_violation using message='Enter valid simulated offer terms and a future expiry date.'; end if;
    advance_minor:=(app.invoice_total_minor*target_advance_bps+5000)/10000;fee_minor:=(advance_minor*target_fee_bps+5000)/10000;
    if advance_minor<=0 or advance_minor>app.invoice_total_minor or fee_minor<0 or fee_minor>=advance_minor then raise check_violation using message='The simulated offer calculation is outside the allowed range.'; end if;
    expiry_time:=(target_expiry_date+time '23:59:59') at time zone 'Africa/Johannesburg';
    insert into public.offers(id,application_id,funder_organization_id,status,currency,advance_amount_minor,fee_amount_minor,net_advance_minor,fee_bps,advance_bps,invoice_amount_minor,payment_due_on,expires_at,made_by,decision_kind,decision_payload_hash)
    values(offer_id,app.id,funder_org,'offered',app.currency,advance_minor,fee_minor,advance_minor-fee_minor,target_fee_bps,target_advance_bps,app.invoice_total_minor,app.invoice_due_on,expiry_time,auth.uid(),'offer',payload_hash);
    update public.applications set status='offer_made' where id=app.id;
    insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'funder.simulated_offer_created','offer',offer_id,jsonb_build_object('funderOrganizationId',funder_org,'advanceBps',target_advance_bps,'feeBps',target_fee_bps));
  end if;
  return jsonb_build_object('offerId',offer_id,'status',case when is_decline then 'declined' else 'offered' end,'replayed',false);
end;$$;

create or replace function public.respond_to_simulated_offer_v1(target_offer_id uuid,target_decision text,target_reason text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare offer_row public.offers%rowtype; app public.applications%rowtype;
begin
  if target_decision not in ('accept','decline') then raise check_violation using message='Choose accept or decline.'; end if;
  select * into offer_row from public.offers where id=target_offer_id for update;select * into app from public.applications where id=offer_row.application_id for update;
  if offer_row.id is null or offer_row.decision_kind<>'offer' or not public.has_organization_role(app.owner_organization_id,'sme') then raise insufficient_privilege using message='The simulated offer response could not be saved.'; end if;
  if offer_row.status<>'offered' then
    if (target_decision='accept' and offer_row.status='accepted') or (target_decision='decline' and offer_row.status='declined' and offer_row.response_reason=trim(target_reason)) then return jsonb_build_object('offerId',offer_row.id,'status',offer_row.status,'replayed',true); end if;
    raise unique_violation using message='This offer already has an immutable response.';
  end if;
  if offer_row.expires_at<=now() then raise check_violation using message='This simulated offer has expired.'; end if;
  if target_decision='decline' and char_length(trim(coalesce(target_reason,''))) not between 3 and 500 then raise check_violation using message='Explain why you are declining this simulated offer.'; end if;
  update public.offers set status=case when target_decision='accept' then 'accepted'::public.offer_status else 'declined'::public.offer_status end,responded_by=auth.uid(),responded_at=now(),response_reason=case when target_decision='decline' then trim(target_reason) else null end where id=offer_row.id;
  update public.applications set status=case when target_decision='accept' then 'offer_accepted'::public.application_status else 'offer_declined'::public.application_status end where id=app.id;
  insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),case when target_decision='accept' then 'sme.simulated_offer_accepted' else 'sme.simulated_offer_declined' end,'offer',offer_row.id,'{}'::jsonb);
  return jsonb_build_object('offerId',offer_row.id,'status',case when target_decision='accept' then 'accepted' else 'declined' end,'replayed',false);
end;$$;

create or replace function public.complete_simulated_funding(target_offer_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare offer_row public.offers%rowtype; app public.applications%rowtype;
begin
  select * into offer_row from public.offers where id=target_offer_id for update;select * into app from public.applications where id=offer_row.application_id for update;
  if offer_row.id is null or offer_row.status<>'accepted' or not public.has_organization_role(app.owner_organization_id,'sme') or app.status not in ('offer_accepted','funded_simulated') then raise insufficient_privilege using message='Simulated funding could not be completed.'; end if;
  if app.status='offer_accepted' then update public.applications set status='funded_simulated' where id=app.id;insert into public.audit_events(organization_id,application_id,actor_profile_id,action,resource_type,resource_id,metadata) values(app.owner_organization_id,app.id,auth.uid(),'application.simulated_funding_completed','offer',offer_row.id,jsonb_build_object('simulation',true)); end if;
  return jsonb_build_object('offerId',offer_row.id,'status','funded_simulated','replayed',app.status='funded_simulated');
end;$$;

revoke all on function public.start_funder_review(uuid),public.create_funder_decision_v1(uuid,integer,integer,date,text),public.respond_to_simulated_offer_v1(uuid,text,text),public.complete_simulated_funding(uuid) from public,anon;
grant execute on function public.start_funder_review(uuid),public.create_funder_decision_v1(uuid,integer,integer,date,text),public.respond_to_simulated_offer_v1(uuid,text,text),public.complete_simulated_funding(uuid) to authenticated;
