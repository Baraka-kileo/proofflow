alter function public.respond_to_simulated_offer_v1(uuid,text,text)
  rename to respond_to_funding_proposal_v1;

revoke execute on function public.complete_simulated_funding(uuid) from authenticated;

comment on function public.complete_simulated_funding(uuid) is
'Legacy function retained only for migration compatibility. Interactive use is revoked; disbursement requires an authorised funding-partner callback.';
