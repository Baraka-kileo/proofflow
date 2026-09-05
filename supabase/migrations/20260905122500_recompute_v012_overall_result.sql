create or replace function public.recompute_verification_overall_after_v012()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.rule_code = 'V012' then
    update public.verification_runs vr set overall_result = (
      select case
        when bool_or(vc.result = 'fail') then 'fail'::public.check_result
        when bool_or(vc.result = 'review') then 'review'::public.check_result
        else 'pass'::public.check_result
      end
      from public.verification_checks vc
      where vc.verification_run_id = new.verification_run_id
    ) where vr.id = new.verification_run_id;
  end if;
  return new;
end;
$$;

create trigger verification_checks_recompute_overall_after_v012
after insert on public.verification_checks
for each row execute function public.recompute_verification_overall_after_v012();

update public.verification_runs vr set overall_result = summary.result
from (
  select verification_run_id, case
    when bool_or(result = 'fail') then 'fail'::public.check_result
    when bool_or(result = 'review') then 'review'::public.check_result
    else 'pass'::public.check_result
  end as result
  from public.verification_checks
  group by verification_run_id
  having count(*) filter (where rule_code = 'V012') = 1
) summary where summary.verification_run_id = vr.id;
