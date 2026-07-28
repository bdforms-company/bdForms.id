-- Create batch check-in function to handle high throughput offline-sync reconciliation
create or replace function public.batch_check_in(tokens text[])
returns table (
  qr_token text,
  is_checked_in boolean,
  check_in_time timestamptz
)
language sql
security definer
set search_path = public
as $$
  update participants p
  set
    is_checked_in = true,
    check_in_time = coalesce(p.check_in_time, now())
  where p.qr_token = any(tokens)
  returning p.qr_token, p.is_checked_in, p.check_in_time;
$$;
