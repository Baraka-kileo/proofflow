alter type public.application_status add value if not exists 'buyer_system_checking';
alter type public.application_status add value if not exists 'buyer_system_verified';
alter type public.application_status add value if not exists 'buyer_exception_review';
alter type public.application_status add value if not exists 'buyer_system_blocked';
